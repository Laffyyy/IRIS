const express = require('express');
const router = express.Router();
const fpOtpController = require('../controllers/fpOtpController');


// OTP
router.post('/send-otp', fpOtpController.sendOtp);
router.post('/verify-otp', fpOtpController.verifyOtp);

module.exports = router;
