const db = require('../config/db');

class PasswordExpirationService {
  async checkPasswordExpiration(userId) {
    try {
      console.log('Checking password expiration for user:', userId);
      
      // Try tbl_login first
      let [rows] = await db.query(
        'SELECT dUser_ID, tExpirationDate, dStatus FROM tbl_login WHERE dUser_ID = ?', 
        [userId]
      );
      
      // If not found in tbl_login, check in tbl_admin
      if (rows.length === 0) {
        [rows] = await db.query(
          'SELECT dUser_ID, tExpirationDate, dStatus FROM tbl_admin WHERE dUser_ID = ?', 
          [userId]
        );
      }
      
      // If user not found in either table
      if (rows.length === 0) {
        throw new Error('User not found');
      }
      
      // Find the expiration date
      const expirationDate = rows[0].tExpirationDate;
      
      // If no expiration date is set, password doesn't expire
      if (!expirationDate) {
        return { isExpired: false };
      }
      
      const currentDate = new Date();
      const expDate = new Date(expirationDate);
      const isExpired = currentDate >= expDate;
      
      // Return result without modifying the status
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
      // Try to get current expiration date from tbl_login first
      let [rows] = await db.query(
        'SELECT tExpirationDate FROM tbl_login WHERE dUser_ID = ?', 
        [userId]
      );
      
      let table = 'tbl_login';
      
      // If not found in tbl_login, check tbl_admin
      if (rows.length === 0) {
        [rows] = await db.query(
          'SELECT tExpirationDate FROM tbl_admin WHERE dUser_ID = ?', 
          [userId]
        );
        
        if (rows.length > 0) {
          table = 'tbl_admin';
        } else {
          throw new Error('User not found');
        }
      }
      
      let expirationDate = rows[0].tExpirationDate ? new Date(rows[0].tExpirationDate) : new Date();
      
      // Add days to expiration date
      expirationDate.setDate(expirationDate.getDate() + days);
      
      // Update the expiration date in the appropriate table
      await db.query(
        `UPDATE ${table} SET tExpirationDate = ? WHERE dUser_ID = ?`,
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
      // Try to update tbl_login first
      let result = await db.query(
        'UPDATE tbl_login SET tExpirationDate = ? WHERE dUser_ID = ?',
        [this.getNewExpirationDate(), userId]
      );
      
      // If no rows affected, try tbl_admin
      if (result[0].affectedRows === 0) {
        await db.query(
          'UPDATE tbl_admin SET tExpirationDate = ? WHERE dUser_ID = ?',
          [this.getNewExpirationDate(), userId]
        );
      }
      
      return {
        expirationDate: this.getNewExpirationDate()
      };
    } catch (error) {
      console.error('Error resetting password expiration:', error);
      throw error;
    }
  }

  getNewExpirationDate() {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 90); // 90 days from now
    return expirationDate;
  }
}

module.exports = PasswordExpirationService;