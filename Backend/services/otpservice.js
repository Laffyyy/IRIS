const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();


class OtpService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail", // Use your email service provider
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });
  }

  async generateOtp(userID) {
    try {
        // Generate a new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Check if an OTP already exists for the user
        const [existingOtpRows] = await db.query(
            'SELECT * FROM tbl_otp WHERE dUser_ID = ?',
            [userID]
        );

        if (existingOtpRows.length > 0) {
            // Update the existing OTP row
            await db.query(
                'UPDATE tbl_otp SET dOTP = ?, tOTP_Created = NOW(), tOTP_Expires = ?, dOTP_Status = 0 WHERE dUser_ID = ?',
                [otp, expiresAt, userID]
            );
        } else {
            // Insert a new OTP row
            await db.query(
                'INSERT INTO tbl_otp (dUser_ID, dOTP, tOTP_Created, tOTP_Expires, dOTP_Status) VALUES (?, ?, NOW(), ?, 0)',
                [userID, otp, expiresAt]
            );
        }

        // Retrieve the user's email
        const [userRows] = await db.query(
            'SELECT dEmail FROM tbl_login WHERE dUser_ID = ?',
            [userID]
        );

        if (userRows.length === 0) {
            throw new Error('User email not found');
        }

        const userEmail = userRows[0].dEmail;

        // Send the OTP to the user's email
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: userEmail, // Recipient address
            subject: 'Your OTP Code', // Subject line
            text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`, // Plain text body
        };

        await this.transporter.sendMail(mailOptions);

        console.log(`OTP sent to ${userEmail}`);
        return otp;
    } catch (error) {
        console.error('Error generating OTP:', error.message);
        throw error;
    }
}

  async verifyOtp(userId, otp) {
    const [rows] = await db.query(
      "SELECT * FROM tbl_otp WHERE dUser_ID = ? AND dOTP = ? AND dOTP_Status = 0",
      [userId, otp]
    );

    if (rows.length === 0) {
      throw new Error("Invalid or expired OTP");
    }

    const record = rows[0];
    if (new Date(record.tOTP_Expires) < new Date()) {
      throw new Error("OTP expired");
    }

    // Mark OTP as used
    await db.query("UPDATE tbl_otp SET dOTP_Status = 1 WHERE dOTP_ID = ?", [
      record.dOTP_ID,
    ]);

    return true;
  }

  async getUserEmail(userID) {
    try {
      const [rows] = await db.query(
        "SELECT dEmail FROM tbl_login WHERE dUser_ID = ?",
        [userID]
      );
      if (rows.length === 0) {
        throw new Error("User not found");
      }
      return rows[0].dEmail;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OtpService;