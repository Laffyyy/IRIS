const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();


class OtpService {
  constructor() {
    // Use test email configuration if environment variables are not set
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER || "test@example.com",
        pass: process.env.EMAIL_PASS || "test_password"
      }
    });
  }

  async generateOtp(userID) {
    try {
      // Check if user exists and is active in either table
      let user = null;
      let table = null;

      // Check tbl_login first
      const [loginRows] = await db.query(
        'SELECT dEmail, dStatus FROM tbl_login WHERE dUser_ID = ?',
        [userID]
      );

      if (loginRows.length > 0) {
        user = loginRows[0];
        table = 'tbl_login';
      } else {
        // Check tbl_admin if not found in tbl_login
        const [adminRows] = await db.query(
          'SELECT dEmail, dStatus FROM tbl_admin WHERE dUser_ID = ?',
          [userID]
        );
        if (adminRows.length > 0) {
          user = adminRows[0];
          table = 'tbl_admin';
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      if (user.dStatus === 'DEACTIVATED' || user.dStatus === 'LOCKED') {
        throw new Error('Account is deactivated or locked');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Check if an OTP already exists
      const [existingOtpRows] = await db.query(
        'SELECT * FROM tbl_otp WHERE dUser_ID = ?',
        [userID]
      );

      if (existingOtpRows.length > 0) {
        // Check if there's a recent OTP (within last minute)
        const lastOtp = existingOtpRows[0];
        const timeSinceLastOtp = new Date() - new Date(lastOtp.tOTP_Created);
        if (timeSinceLastOtp < 60000) { // 1 minute
          throw new Error('Please wait a minute before requesting a new OTP');
        }

        await db.query(
          'UPDATE tbl_otp SET dOTP = ?, tOTP_Created = NOW(), tOTP_Expires = ?, dOTP_Status = 0 WHERE dUser_ID = ?',
          [otp, expiresAt, userID]
        );
      } else {
        await db.query(
          'INSERT INTO tbl_otp (dUser_ID, dOTP, tOTP_Created, tOTP_Expires, dOTP_Status) VALUES (?, ?, NOW(), ?, 0)',
          [userID, otp, expiresAt]
        );
      }

      // Send OTP email
      const mailOptions = {
        from: process.env.EMAIL_USER || "test@example.com",
        to: user.dEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`
      };

      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${user.dEmail}`);
      } catch (emailError) {
        console.error('Error sending email:', emailError.message);
        // In development, we'll still return the OTP
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: OTP is', otp);
        }
      }

      return { message: 'OTP sent successfully', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
    } catch (error) {
      console.error('Error generating OTP:', error.message);
      throw error;
    }
  }

  async verifyOtp(userId, otp) {
    try {
      // Check if user exists and is active in either table
      let user = null;
      let table = null;

      // Check tbl_login first
      const [loginRows] = await db.query(
        'SELECT dStatus FROM tbl_login WHERE dUser_ID = ?',
        [userId]
      );

      if (loginRows.length > 0) {
        user = loginRows[0];
        table = 'tbl_login';
      } else {
        // Check tbl_admin if not found in tbl_login
        const [adminRows] = await db.query(
          'SELECT dStatus FROM tbl_admin WHERE dUser_ID = ?',
          [userId]
        );
        if (adminRows.length > 0) {
          user = adminRows[0];
          table = 'tbl_admin';
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      if (user.dStatus === 'DEACTIVATED' || user.dStatus === 'LOCKED') {
        throw new Error('Account is deactivated or locked');
      }

      const [otpRows] = await db.query(
        "SELECT * FROM tbl_otp WHERE dUser_ID = ? ORDER BY tOTP_Created DESC LIMIT 1",
        [userId]
      );

      if (otpRows.length === 0) {
        throw new Error('No OTP found. Please request a new OTP.');
      }

      const otpRecord = otpRows[0];
      const currentTime = new Date();

      if (new Date(otpRecord.tOTP_Expires) < currentTime) {
        throw new Error('OTP has expired. Please request a new OTP.');
      }

      if (otpRecord.dOTP_Status === 1) {
        throw new Error('OTP has already been used. Please request a new OTP.');
      }

      if (otp !== otpRecord.dOTP) {
        throw new Error('Invalid OTP');
      }

      // Mark OTP as used
      await db.query(
        "UPDATE tbl_otp SET dOTP_Status = 1 WHERE dOTP_ID = ?",
        [otpRecord.dOTP_ID]
      );

      return { 
        message: 'OTP verified successfully',
        verified: true
      };
    } catch (error) {
      console.error('Error in verifyOtp:', error.message);
      throw error;
    }
  }

  async getUserEmail(userID) {
    try {
      // Check tbl_login first
      const [loginRows] = await db.query(
        "SELECT dEmail FROM tbl_login WHERE dUser_ID = ?",
        [userID]
      );

      if (loginRows.length > 0) {
        return loginRows[0].dEmail;
      }

      // Check tbl_admin if not found in tbl_login
      const [adminRows] = await db.query(
        "SELECT dEmail FROM tbl_admin WHERE dUser_ID = ?",
        [userID]
      );

      if (adminRows.length > 0) {
        return adminRows[0].dEmail;
      }

      throw new Error("User not found");
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OtpService;