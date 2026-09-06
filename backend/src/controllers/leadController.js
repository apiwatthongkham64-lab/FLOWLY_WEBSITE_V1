const repo=require('../repositories/leadRepository');const { HttpError }=require('../utils/httpError');
async function list(req,res){res.json({ok:true,data:await repo.list(req.user.businessId,req.query)});}
async function create(req,res){if(!req.body?.title)throw new HttpError(400,'title is required','VALIDATION_ERROR');res.status(201).json({ok:true,data:await repo.create(req.user.businessId,req.body)});}
async function update(req,res){const data=await repo.update(req.user.businessId,req.params.id,req.body||{});if(!data)throw new HttpError(404,'Lead not found','LEAD_NOT_FOUND');res.json({ok:true,data});}
module.exports={list,create,update};
