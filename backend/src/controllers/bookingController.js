const repo=require('../repositories/bookingRepository'); const {HttpError}=require('../utils/httpError');
async function list(req,res){res.json({ok:true,data:await repo.list(req.user.businessId,req.query)});}
async function create(req,res){if(!req.body?.startsAt)throw new HttpError(400,'startsAt is required','VALIDATION_ERROR');res.status(201).json({ok:true,data:await repo.create(req.user.businessId,req.body,req.user.id)});}
async function update(req,res){const data=await repo.update(req.user.businessId,req.params.id,req.body||{},req.user.id);if(!data)throw new HttpError(404,'Booking not found','BOOKING_NOT_FOUND');res.json({ok:true,data});}
module.exports={list,create,update};
