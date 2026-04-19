const express = require('express');
const router = express.Router();
const {
  register, registerAdmin, login, getProfile, updateProfile,
  getNotifications, markNotificationsRead,
  forgotPassword, resetPassword,
  changePassword,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { registerValidation, adminRegisterValidation, loginValidation, validate } = require('../middleware/validate');

router.post('/register', registerValidation, validate, register);
router.post('/register-admin', protect, adminOnly, adminRegisterValidation, validate, registerAdmin);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

module.exports = router;
