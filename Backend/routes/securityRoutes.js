const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/get-security-question', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT dSecurity_Question1 as question1, dAnswer_1 as answer1,
              dSecurity_Question2 as question2, dAnswer_2 as answer2,
              dSecurity_Question3 as question3, dAnswer_3 as answer3
       FROM iris.tbl_login WHERE dEmail = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No security questions found for this email." });
    }

    // Return all questions and answers with consistent naming
    res.json({
      question1: rows[0].question1,
      answer1: rows[0].answer1,
      question2: rows[0].question2,
      answer2: rows[0].answer2,
      question3: rows[0].question3,
      answer3: rows[0].answer3
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error." });
  }
});

module.exports = router;