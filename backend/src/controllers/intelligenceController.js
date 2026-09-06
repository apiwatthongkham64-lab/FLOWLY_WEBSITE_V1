const service=require('../services/intelligenceService');
const repo=require('../repositories/intelligenceRepository');
const {HttpError}=require('../utils/httpError');
async function overview(req,res){res.json({ok:true,data:await service.overview({businessId:req.user.businessId,department:req.query.department,refresh:String(req.query.refresh||'false')==='true'})});}
async function generate(req,res){res.status(201).json({ok:true,data:await service.generate({businessId:req.user.businessId,department:req.body?.department})});}
async function list(req,res){res.json({ok:true,data:await repo.listInsights(req.user.businessId,req.query)});}
async function setStatus(req,res){const allowed=['accepted','dismissed','completed','expired'];if(!allowed.includes(req.body?.status))throw new HttpError(400,'Invalid insight status','VALIDATION_ERROR');const data=await repo.updateStatus(req.user.businessId,req.params.id,req.body.status);if(!data)throw new HttpError(404,'Insight not found','INSIGHT_NOT_FOUND');res.json({ok:true,data});}
module.exports={overview,generate,list,setStatus};
