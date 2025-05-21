const express = require('express');
const router = express.Router();

const OtpControllerClass = require('../controllers/otpcontoller'); // Import the controller class

const otpController = new OtpControllerClass(); // Instantiate the class

router.post('/generate', (req, res) => otpController.sendOtp(req, res));

module.exports = router;