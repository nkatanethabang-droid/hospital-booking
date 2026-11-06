import { Router } from 'express';
import db from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';
const r=Router();

r.get('/',asyncHandler(async(req,res)=>{
  const q=`SELECT d.*, dep.name AS department FROM doctors d LEFT JOIN departments dep ON dep.id=d.department_id
    WHERE d.active=1 AND (?='' OR d.full_name LIKE ? OR d.specialty LIKE ? OR dep.name LIKE ?)
    AND (?=0 OR d.department_id=?) ORDER BY d.full_name`;
  const term=String(req.query.search||'').trim();
  const dep=Number(req.query.departmentId||0);
  const [rows]=await db.execute(q,[term,`%${term}%`,`%${term}%`,`%${term}%`,dep,dep]);
  res.json(rows);
}));
r.get('/departments',asyncHandler(async(req,res)=>{
  const [rows]=await db.execute('SELECT * FROM departments ORDER BY name'); res.json(rows);
}));
r.get('/:id',asyncHandler(async(req,res)=>{
  const [rows]=await db.execute('SELECT d.*,dep.name AS department FROM doctors d LEFT JOIN departments dep ON dep.id=d.department_id WHERE d.id=? AND d.active=1',[req.params.id]);
  if(!rows.length)return res.status(404).json({message:'Doctor not found.'});
  res.json(rows[0]);
}));
r.post('/',authenticate,adminOnly,asyncHandler(async(req,res)=>{
  const {full_name,specialty,department_id,bio,email,phone,consultation_fee}=req.body;
  if(!full_name||!specialty)return res.status(400).json({message:'Doctor name and specialty are required.'});
  const [x]=await db.execute('INSERT INTO doctors (full_name,specialty,department_id,bio,email,phone,consultation_fee) VALUES (?,?,?,?,?,?,?)',[full_name,specialty,department_id||null,bio||null,email||null,phone||null,Number(consultation_fee||0)]);
  res.status(201).json({id:x.insertId,message:'Doctor added.'});
}));
r.put('/:id',authenticate,adminOnly,asyncHandler(async(req,res)=>{
  const {full_name,specialty,department_id,bio,email,phone,consultation_fee,active}=req.body;
  await db.execute('UPDATE doctors SET full_name=?,specialty=?,department_id=?,bio=?,email=?,phone=?,consultation_fee=?,active=? WHERE id=?',[full_name,specialty,department_id||null,bio||null,email||null,phone||null,Number(consultation_fee||0),active===false?0:1,req.params.id]);
  res.json({message:'Doctor updated.'});
}));
r.delete('/:id',authenticate,adminOnly,asyncHandler(async(req,res)=>{
  await db.execute('UPDATE doctors SET active=0 WHERE id=?',[req.params.id]); res.json({message:'Doctor removed from directory.'});
}));
export default r;
