const express = require("express");
const router = express.Router();

const OtpController = require("../controllers/otpcontoller"); // Import the controller

const otpController = new OtpController(); // Instantiate the class

router.post("/send", (req, res) => otpController.sendOtp(req, res));

module.exports = router;