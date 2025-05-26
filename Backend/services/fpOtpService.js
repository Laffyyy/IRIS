// services/fpOtpService.js
const db = require('../config/db');
const nodemailer = require('nodemailer');
const securityQuestionsService = require('./securityQuestionsService');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtpCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
};

exports.sendOtp = async (email) => {
  // First check tbl_login
  let [userRows] = await db.query(
    'SELECT dUser_ID, dStatus FROM tbl_login WHERE BINARY dEmail = ?',
    [email]
  );

  // If not found in tbl_login, check tbl_admin
  if (userRows.length === 0) {
    [userRows] = await db.query(
      'SELECT dUser_ID, dStatus FROM tbl_admin WHERE BINARY dEmail = ?',
      [email]
    );
  }

  if (userRows.length === 0) {
    throw new Error('Email not registered');
  }

  const userId = userRows[0].dUser_ID;
  const status = userRows[0].dStatus;

  // Status checks
  if (status === 'LOCKED' || status === 'DEACTIVATED') {
    throw new Error('Account is locked or deactivated, Please contact an admin.');
  }
  if (status === 'FIRST-TIME') {
    throw new Error('Create a security questions first.');
  }
  if (status === 'RESET-DONE') {
    throw new Error('No Security Question since account was reset.');
  }
  // Only proceed if ACTIVE
  if (status !== 'ACTIVE') {
    throw new Error('Account status not supported.');
  }

  // Check if user has security questions
  const hasQuestions = await securityQuestionsService.hasSecurityQuestions(email);
  if (!hasQuestions) {
    throw new Error('No security questions found. Please set up security questions first.');
  }

  const otp = generateOtpCode();
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

  const [existingRows] = await db.query(
    'SELECT * FROM tbl_otp WHERE dUser_ID = ?',
    [userId]
  );

  if (existingRows.length > 0) {
    await db.query(
      `UPDATE tbl_otp SET dOTP = ?, tOTP_Created = NOW(), tOTP_Expires = ?, dOTP_Status = 0 WHERE dUser_ID = ?`,
      [otp, expiresAt, userId]
    );
  } else {
    await db.query(
      `INSERT INTO tbl_otp (dUser_ID, dOTP, tOTP_Created, tOTP_Expires, dOTP_Status)
       VALUES (?, ?, NOW(), ?, 0)`,
      [userId, otp, expiresAt]
    );
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}. It expires in 3 minutes.`,
  });

  return { message: 'OTP sent successfully.', userId };
};

exports.verifyOtp = async ({ userId, email, otp }) => {
  if (!otp) throw new Error('OTP is required');

  // Find userId if only email provided
  if (!userId && email) {
    // Check tbl_login first
    let [userRows] = await db.query(
      'SELECT dUser_ID FROM tbl_login WHERE BINARY dEmail = ?',
      [email]
    );

    // If not found in tbl_login, check tbl_admin
    if (userRows.length === 0) {
      [userRows] = await db.query(
        'SELECT dUser_ID FROM tbl_admin WHERE BINARY dEmail = ?',
        [email]
      );
    }

    if (userRows.length === 0) {
      throw new Error('Email not registered');
    }
    userId = userRows[0].dUser_ID;
  }

  if (!userId) {
    throw new Error('User ID or valid email required');
  }

  // Query for latest matching OTP that is unused and not expired
  const [rows] = await db.query(
    `SELECT * FROM tbl_otp 
     WHERE dUser_ID = ? 
       AND dOTP = ? 
       AND dOTP_Status = 0 
       AND tOTP_Expires > NOW()
     ORDER BY tOTP_Created DESC LIMIT 1`,
    [userId, otp]
  );

  if (rows.length === 0) {
    throw new Error('Invalid or expired OTP');
  }

  // Mark OTP as used
  await db.query(
    'UPDATE tbl_otp SET dOTP_Status = 1 WHERE dUser_ID = ? AND dOTP = ?',
    [userId, otp]
  );

  const redirectPath = '/security-questions';
  return { message: 'OTP verified successfully', redirect: redirectPath };
};
