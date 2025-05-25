const PasswordExpirationService = require('../services/passwordExpirationService');

class PasswordExpirationController {
  constructor() {
    this.passwordExpirationService = new PasswordExpirationService();
  }

  async checkPasswordExpiration(req, res) {
    try {
      const { userId } = req.body;
      const result = await this.passwordExpirationService.checkPasswordExpiration(userId);
      
      // Format the response
      let response = { isExpired: result };
      
      // If the service returns an object with expirationDate, calculate minutes left
      if (result && typeof result === 'object' && result.expirationDate) {
        const now = new Date();
        const expDate = new Date(result.expirationDate);
        const minutesLeft = Math.floor((expDate - now) / (1000 * 60));
        
        response = {
          isExpired: now >= expDate,
          minutesLeft: minutesLeft > 0 ? minutesLeft : 0,
          expirationDate: result.expirationDate
        };
      }
      
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error checking password expiration', 
        error: error.message 
      });
    }
  }

  async extendPasswordExpiration(req, res) {
    try {
      const { userId, days } = req.body;
      const result = await this.passwordExpirationService.extendPasswordExpiration(userId, days);
      res.status(200).json({ 
        message: 'Password expiration extended successfully',
        newExpirationDate: result.expirationDate
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error extending password expiration', 
        error: error.message 
      });
    }
  }

  async resetPasswordExpiration(req, res) {
    try {
      const { userId } = req.body;
      const result = await this.passwordExpirationService.resetPasswordExpiration(userId);
      res.status(200).json({ 
        message: 'Password expiration reset successfully',
        newExpirationDate: result.expirationDate 
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error resetting password expiration', 
        error: error.message 
      });
    }
  }
}

module.exports = PasswordExpirationController;