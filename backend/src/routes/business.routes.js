const router=require('express').Router();
const controller=require('../controllers/businessController');
const {requireAuth,requirePermission}=require('../middleware/auth');
const {asyncHandler}=require('../utils/asyncHandler');
const {auditMutation}=require('../middleware/auditMutation');
router.get('/me',requireAuth,requirePermission('business:read'),asyncHandler(controller.getCurrentBusiness));
router.patch('/me',requireAuth,requirePermission('business:write'),auditMutation('business.profile.update'),asyncHandler(controller.updateCurrentBusiness));
module.exports=router;
