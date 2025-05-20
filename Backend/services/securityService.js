const pool = require('../config/db');
const express = require('express');
const router = express.Router();

async function getSecurityQuestionsByEmail(email) {
  const [rows] = await pool.query(
    `SELECT dSecurity_Question1 as question1, dAnswer_1 as answer1,
            dSecurity_Question2 as question2, dAnswer_2 as answer2,
            dSecurity_Question3 as question3, dAnswer_3 as answer3
     FROM iris.tbl_login WHERE dEmail = ?`,
    [email]
  );
  return rows;
}

module.exports = { getSecurityQuestionsByEmail };