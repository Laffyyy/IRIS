const otpService = require('../services/otpService'); // Import the OTP service

class OtpController {
  constructor() {
    console.log('Initializing OTP Controller');
    this.otpService = new otpService(); // Create an instance of the OTP service
  }

  async sendOtp(req, res) {
    try {
      console.log('OTP Controller - sendOtp called with request body:', req.body);
      
      if (!req.body || !req.body.userId) {
        console.error('Missing userId in request body');
        return res.status(400).json({ error: 'Missing userId in request body' });
      }
      
      const { userId } = req.body;
      console.log(`OTP Controller - Sending OTP for userId: ${userId}`);
      
      // Generate OTP and send email
      await this.otpService.generateOtp(userId);
      
      console.log('OTP Controller - OTP generated and email sent successfully');
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('OTP Controller - Error in sendOtp:', error);
      res.status(500).json({ error: 'Failed to send OTP', message: error.message });
    }
  }
}

module.exports = OtpController;