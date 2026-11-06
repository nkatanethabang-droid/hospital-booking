import { Router } from 'express';
import db from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { asyncHandler, createNotification } from '../utils.js';
const r=Router();

r.get('/availability/:doctorId',asyncHandler(async(req,res)=>{
  const [rows]=await db.execute(`
    SELECT a.id,a.available_date,a.start_time,a.end_time,a.slot_minutes
    FROM doctor_availability a
    WHERE a.doctor_id=? AND a.is_available=1 AND a.available_date>=CURDATE()
    ORDER BY a.available_date,a.start_time`,[req.params.doctorId]);
  const [booked]=await db.execute(`SELECT appointment_date,appointment_time FROM appointments WHERE doctor_id=? AND status IN ('pending','confirmed')`,[req.params.doctorId]);
  const taken=new Set(booked.map(x=>`${x.appointment_date} ${x.appointment_time}`));
  const slots=[];
  for(const a of rows){
    const [sh,sm]=a.start_time.split(':').map(Number),[eh,em]=a.end_time.split(':').map(Number);
    let t=sh*60+sm,end=eh*60+em;
    while(t+a.slot_minutes<=end){
      const hh=String(Math.floor(t/60)).padStart(2,'0'),mm=String(t%60).padStart(2,'0');
      const time=`${hh}:${mm}:00`,key=`${a.available_date} ${time}`;
      if(!taken.has(key))slots.push({date:a.available_date,time,availabilityId:a.id});
      t+=a.slot_minutes;
    }
  }
  res.json(slots);
}));

r.get('/',authenticate,asyncHandler(async(req,res)=>{
  const admin=req.user.role==='admin';
  const sql=`SELECT a.*,d.full_name AS doctor_name,d.specialty,u.full_name AS patient_name
    FROM appointments a JOIN doctors d ON d.id=a.doctor_id JOIN users u ON u.id=a.patient_id
    ${admin?'':'WHERE a.patient_id=?'} ORDER BY a.appointment_date DESC,a.appointment_time DESC`;
  const [rows]=await db.execute(sql,admin?[]:[req.user.id]); res.json(rows);
}));

r.post('/',authenticate,asyncHandler(async(req,res)=>{
  const {doctorId,date,time,reason}=req.body;
  if(!doctorId||!date||!time)return res.status(400).json({message:'Choose a doctor, date and time.'});
  if(new Date(`${date}T${time}`).getTime()<=Date.now())return res.status(400).json({message:'Choose a future appointment time.'});
  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    const [doctor]=await conn.execute('SELECT id FROM doctors WHERE id=? AND active=1 FOR UPDATE',[doctorId]);
    if(!doctor.length){await conn.rollback();return res.status(404).json({message:'Doctor not found.'});}
    const [existing]=await conn.execute("SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status IN ('pending','confirmed') FOR UPDATE",[doctorId,date,time]);
    if(existing.length){await conn.rollback();return res.status(409).json({message:'That appointment slot has already been booked. Please choose another.'});}
    const [result]=await conn.execute("INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,'pending')",[req.user.id,doctorId,date,time,reason||null]);
    await conn.execute('INSERT INTO notifications (user_id,message) VALUES (?,?)',[req.user.id,'Your appointment request has been received and is pending confirmation.']);
    await conn.commit();res.status(201).json({id:result.insertId,message:'Appointment request submitted.'});
  }catch(e){await conn.rollback();if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'That appointment slot was just booked. Please select another.'});throw e;}
  finally{conn.release();}
}));

r.patch('/:id/cancel',authenticate,asyncHandler(async(req,res)=>{
  const [rows]=await db.execute("SELECT * FROM appointments WHERE id=? AND patient_id=? AND status IN ('pending','confirmed')",[req.params.id,req.user.id]);
  if(!rows.length)return res.status(404).json({message:'Appointment not found or cannot be cancelled.'});
  await db.execute("UPDATE appointments SET status='cancelled' WHERE id=?",[req.params.id]);
  await createNotification(db,req.user.id,'Your appointment has been cancelled.');
  res.json({message:'Appointment cancelled.'});
}));
r.patch('/:id/reschedule',authenticate,asyncHandler(async(req,res)=>{
  const {date,time}=req.body;
  if(!date||!time)return res.status(400).json({message:'Choose a new date and time.'});
  const [rows]=await db.execute("SELECT id,doctor_id FROM appointments WHERE id=? AND patient_id=? AND status IN ('pending','confirmed')",[req.params.id,req.user.id]);
  if(!rows.length)return res.status(404).json({message:'Appointment not found.'});
  try{
    await db.execute("UPDATE appointments SET appointment_date=?,appointment_time=?,status='pending' WHERE id=?",[date,time,req.params.id]);
    await createNotification(db,req.user.id,'Your appointment was rescheduled and is pending confirmation.');
    res.json({message:'Appointment rescheduled. It is now pending confirmation.'});
  }catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'That appointment slot is already booked.'});throw e;}
}));
r.patch('/:id/status',authenticate,adminOnly,asyncHandler(async(req,res)=>{
  const allowed=['confirmed','rejected','completed','cancelled'];
  const {status}=req.body;if(!allowed.includes(status))return res.status(400).json({message:'Invalid appointment status.'});
  const [rows]=await db.execute('SELECT patient_id FROM appointments WHERE id=?',[req.params.id]);
  if(!rows.length)return res.status(404).json({message:'Appointment not found.'});
  await db.execute('UPDATE appointments SET status=? WHERE id=?',[status,req.params.id]);
  await createNotification(db,rows[0].patient_id,`Your appointment status is now ${status}.`);
  res.json({message:'Appointment status updated.'});
}));
export default r;
