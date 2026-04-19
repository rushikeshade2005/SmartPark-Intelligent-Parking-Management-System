const express = require('express');
const router = express.Router();
const {
  getSettings, updateSettings, getPublicSettings, getActivityLogs,
} = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/public', getPublicSettings);
router.get('/activity-log', protect, adminOnly, getActivityLogs);
router.get('/', protect, adminOnly, getSettings);
router.put('/', protect, adminOnly, updateSettings);

module.exports = router;
