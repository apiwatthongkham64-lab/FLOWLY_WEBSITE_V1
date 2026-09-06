const router = require('express').Router();
const controller = require('../controllers/authController');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimit');
const { env } = require('../config/env');

const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: env.loginRateLimitMax, keyPrefix: 'login' });
router.post('/login', loginLimiter, validateLogin, asyncHandler(controller.login));
router.get('/me', requireAuth, asyncHandler(controller.me));
router.post('/logout', requireAuth, asyncHandler(controller.logout));
module.exports = router;
