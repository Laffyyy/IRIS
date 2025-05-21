const db = require('../config/db');

class PasswordExpirationService {
  async checkPasswordExpiration(userId) {
    try {
      console.log('Checking password expiration for user:', userId);
      
      const [rows] = await db.query(
        'SELECT * FROM tbl_login WHERE dUser_ID = ?', 
        [userId]
      );
      
      if (rows.length === 0) {
        throw new Error('User not found');
      }
      
      // Find the correct expiration date column
      const expirationDate = rows[0].tExpirationDate;
      
      // If no expiration date is set, password doesn't expire
      if (!expirationDate) {
        return { isExpired: false };
      }
      
      const currentDate = new Date();
      const expDate = new Date(expirationDate);
      const isExpired = currentDate >= expDate;
      
      return {
        isExpired: isExpired,
        expirationDate: expirationDate // Return the raw expiration date
      };
    } catch (error) {
      console.error('Error checking password expiration:', error);
      throw error;
    }
  }

  async extendPasswordExpiration(userId, days) {
    try {
      // Get current expiration date
      const [rows] = await db.query(
        'SELECT tExpirationDate FROM tbl_login WHERE dUser_ID = ?', 
        [userId]
      );
      
      if (rows.length === 0) {
        throw new Error('User not found');
      }
      
      let expirationDate = rows[0].tExpirationDate ? new Date(rows[0].tExpirationDate) : new Date();
      
      // Add days to expiration date
      expirationDate.setDate(expirationDate.getDate() + days);
      
      // Update the expiration date in the database
      await db.query(
        'UPDATE tbl_login SET tExpirationDate = ? WHERE dUser_ID = ?',
        [expirationDate, userId]
      );
      
      return {
        expirationDate: expirationDate
      };
    } catch (error) {
      console.error('Error extending password expiration:', error);
      throw error;
    }
  }

  async resetPasswordExpiration(userId) {
    try {
      // Set expiration date to 90 days from now (or whatever your default policy is)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 90);
      
      await db.query(
        'UPDATE tbl_login SET tExpirationDate = ? WHERE dUser_ID = ?',
        [expirationDate, userId]
      );
      
      return {
        expirationDate: expirationDate
      };
    } catch (error) {
      console.error('Error resetting password expiration:', error);
      throw error;
    }
  }
}

module.exports = PasswordExpirationService;