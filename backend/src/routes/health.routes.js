const router = require('express').Router();
const { databaseStatus } = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');
router.get('/', asyncHandler(async (_req, res) => {
  const database = await databaseStatus();
  res.json({ ok: true, data: { service: 'flowly-api', version: '2.36.0', time: new Date().toISOString(), database } });
}));
module.exports = router;
