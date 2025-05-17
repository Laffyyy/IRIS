const otpService = require('../services/otpService'); // Import the OTP service

class OtpController {
  constructor() {
    this.otpService = new otpService(); // Create an instance of the OTP service
  }

  async sendOtp(req, res) {
    try {
      const { userId } = req.body;
      await this.otpService.generateOtp( userId);

      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  }

 
}

module.exports = OtpController;