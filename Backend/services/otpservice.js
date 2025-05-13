const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

class OtpService {
  constructor() {
    console.log('Initializing OTP Service');
    console.log('Email configuration:', {
      service: 'gmail',
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : 'Not set',
      pass: process.env.EMAIL_PASS ? 'Password set' : 'Password not set'
    });
    
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Test SMTP connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('SMTP connection successful! Server ready to send emails');
      }
    });
  }

  async generateOtp(userID) {
    try {
      console.log(`OTP Service - Generating OTP for user: ${userID}`);
      
      // Generate a new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
      
      console.log(`OTP generated: ${otp}, expires at: ${expiresAt}`);

      // Check if an OTP already exists for the user
      console.log('Checking for existing OTP record');
      const [existingOtpRows] = await db.query(
          'SELECT * FROM tbl_otp WHERE dUser_ID = ?',
          [userID]
      );

      if (existingOtpRows.length > 0) {
        console.log('Existing OTP found, updating record');
        // Update the existing OTP row
        await db.query(
            'UPDATE tbl_otp SET dOTP = ?, tOTP_Created = NOW(), tOTP_Expires = ?, dOTP_Status = 0 WHERE dUser_ID = ?',
            [otp, expiresAt, userID]
        );
      } else {
        console.log('No existing OTP, creating new record');
        // Insert a new OTP row
        await db.query(
            'INSERT INTO tbl_otp (dUser_ID, dOTP, tOTP_Created, tOTP_Expires, dOTP_Status) VALUES (?, ?, NOW(), ?, 0)',
            [userID, otp, expiresAt]
        );
      }
      
      // Get the user's email
      console.log('Retrieving user email');
      const userEmail = await this.getUserEmail(userID);
      console.log(`User email retrieved: ${userEmail}`);
      
      // Send the OTP via email
      console.log('Sending email with OTP');
      await this.sendOtpEmail(userEmail, otp);
      console.log('Email sent successfully');

      return otp;
    } catch (error) {
      console.error('Error in generateOtp:', error);
      throw error;
    }
  }

  // Add this new method to send OTP via email
  async sendOtpEmail(email, otp) {
    try {
      console.log(`Sending email to: ${email}`);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your IRIS Login OTP',
        text: `Your One-Time Password for IRIS login is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333;">IRIS Login OTP</h2>
            <p>Your One-Time Password for IRIS login is:</p>
            <h3 style="background-color: #f7f7f7; padding: 10px; text-align: center;">${otp}</h3>
            <p>This OTP will expire in 10 minutes.</p>
          </div>
        `
      };
      
      console.log('Mail options prepared, attempting to send');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent with message ID:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async verifyOtp(userId, otp) {
    console.log(`Verifying OTP for user ${userId}`);
    const [rows] = await db.query(
      "SELECT * FROM tbl_otp WHERE dUser_ID = ? AND dOTP = ? AND dOTP_Status = 0",
      [userId, otp]
    );

    if (rows.length === 0) {
      console.log('Invalid or expired OTP');
      throw new Error("Invalid or expired OTP");
    }

    const record = rows[0];
    if (new Date(record.tOTP_Expires) < new Date()) {
      console.log('OTP has expired');
      throw new Error("OTP expired");
    }

    // Mark OTP as used
    console.log('OTP verified, marking as used');
    await db.query("UPDATE tbl_otp SET dOTP_Status = 1 WHERE dOTP_ID = ?", [
      record.dOTP_ID,
    ]);

    console.log('OTP verification successful');
    return true;
  }

  async getUserEmail(userID) {
    try {
      console.log(`Getting email for user: ${userID}`);
      const [rows] = await db.query(
        "SELECT dEmail FROM tbl_login WHERE dUser_ID = ?",
        [userID]
      );
      
      if (rows.length === 0) {
        console.error('User not found in database');
        throw new Error("User not found");
      }
      
      console.log(`Found email: ${rows[0].dEmail}`);
      return rows[0].dEmail;
    } catch (error) {
      console.error('Error retrieving user email:', error);
      throw error;
    }
  }
}

module.exports = OtpService;