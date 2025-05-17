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

  async generateOtp(userId) {
    const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Check if an OTP already exists for the user
    const [existingOtp] = await db.query(
      "SELECT * FROM tbl_otp WHERE dUser_ID = ?",
      [userId]
    );

    if (existingOtp.length > 0) {
      // Update the existing OTP
      await db.query(
        "UPDATE tbl_otp SET dOTP = ?, tOTP_Expires = ?, dOTP_Status = 0 WHERE dUser_ID = ?",
        [otp, expiry, userId]
      );
    } else {
      // Insert a new OTP
      await db.query(
        "INSERT INTO tbl_otp (dOTP, dUser_ID, dOTP_Status, tOTP_Expires) VALUES (?, ?, ?, ?)",
        [otp, userId, 0, expiry]
      );
    }

    // Fetch the user's email
    const userEmail = await this.getUserEmail(userId);

    // Send OTP via email
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    return otp;
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