const repo=require('../repositories/customerRepository');const { HttpError }=require('../utils/httpError');
async function list(req,res){res.json({ok:true,data:await repo.list(req.user.businessId,req.query)});}
async function create(req,res){if(!req.body?.fullName)throw new HttpError(400,'fullName is required','VALIDATION_ERROR');res.status(201).json({ok:true,data:await repo.create(req.user.businessId,req.body)});}
async function update(req,res){const data=await repo.update(req.user.businessId,req.params.id,req.body||{});if(!data)throw new HttpError(404,'Customer not found','CUSTOMER_NOT_FOUND');res.json({ok:true,data});}
module.exports={list,create,update};
