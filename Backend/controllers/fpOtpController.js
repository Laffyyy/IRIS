const fpOtpService = require('../services/fpOtpService');

// Controller for sending OTP to email
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const result = await fpOtpService.sendOtp(email);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to send OTP' });
  }
};

// Controller for verifying OTP using either userId or email
const verifyOtp = async (req, res) => {
  const { userId, email, otp } = req.body;

  if ((!userId && !email) || !otp) {
    return res.status(400).json({ message: 'Missing userId/email or OTP' });
  }

  try {
    const result = await fpOtpService.verifyOtp({ userId, email, otp });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'OTP verification failed' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
