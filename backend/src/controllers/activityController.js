const repo=require('../repositories/activityRepository'); async function list(req,res){res.json({ok:true,data:await repo.list(req.user.businessId,req.query)});} module.exports={list};
