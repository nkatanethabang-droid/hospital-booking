import {Router} from 'express';
import db from '../config/db.js';
import {authenticate,adminOnly} from '../middleware/auth.js';
import {asyncHandler} from '../utils.js';
const r=Router();r.use(authenticate,adminOnly);
r.get('/stats',asyncHandler(async(req,res)=>{
 const [[p]]=await db.execute("SELECT COUNT(*) AS total FROM users WHERE role='patient'");
 const [[d]]=await db.execute("SELECT COUNT(*) AS total FROM doctors WHERE active=1");
 const [[a]]=await db.execute("SELECT COUNT(*) AS total FROM appointments");
 const [[pending]]=await db.execute("SELECT COUNT(*) AS total FROM appointments WHERE status='pending'");
 res.json({patients:p.total,doctors:d.total,appointments:a.total,pending:pending.total});
}));
r.get('/patients',asyncHandler(async(req,res)=>{
 const [rows]=await db.execute("SELECT id,full_name,email,phone,created_at FROM users WHERE role='patient' ORDER BY created_at DESC");res.json(rows);
}));
r.post('/availability',asyncHandler(async(req,res)=>{
 const {doctorId,date,startTime,endTime,slotMinutes}=req.body;
 if(!doctorId||!date||!startTime||!endTime)return res.status(400).json({message:'Complete all schedule fields.'});
 const [x]=await db.execute('INSERT INTO doctor_availability (doctor_id,available_date,start_time,end_time,slot_minutes) VALUES (?,?,?,?,?)',[doctorId,date,startTime,endTime,Number(slotMinutes||30)]);
 res.status(201).json({id:x.insertId,message:'Availability saved.'});
}));
r.get('/notifications',asyncHandler(async(req,res)=>{
 const [rows]=await db.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30',[req.user.id]);res.json(rows);
}));
r.patch('/notifications/:id/read',asyncHandler(async(req,res)=>{
 await db.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',[req.params.id,req.user.id]);res.json({message:'Notification marked as read.'});
}));
export default r;
