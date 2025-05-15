const express = require('express');
const router = express.Router();
const otpcontroller = require('../controllers/otpccontroller'); // Import the controller

const otpController = new otpcontroller(); // Instantiate the class
router.post('/generate', (req, res) => otpController.generateOtp(req, res));