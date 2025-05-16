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
      `SELECT dSecurity_Question1, dAnswer_1, 
              dSecurity_Question2, dAnswer_2, 
              dSecurity_Question3, dAnswer_3
       FROM iris.tbl_login WHERE dEmail = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No security questions found for this email." });
    }

    const userQuestions = rows[0];
    
    // Extract all non-empty security questions into an array
    const availableQuestions = [];
    if (userQuestions.dSecurity_Question1) {
      availableQuestions.push({
        question: userQuestions.dSecurity_Question1,
        answerKey: 'dAnswer_1' // Used later for verification
      });
    }
    if (userQuestions.dSecurity_Question2) {
      availableQuestions.push({
        question: userQuestions.dSecurity_Question2,
        answerKey: 'dAnswer_2'
      });
    }
    if (userQuestions.dSecurity_Question3) {
      availableQuestions.push({
        question: userQuestions.dSecurity_Question3,
        answerKey: 'dAnswer_3'
      });
    }

    if (availableQuestions.length === 0) {
      return res.status(404).json({ message: "No valid security questions found." });
    }

    // Randomly select one question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    // Return ONLY the question (not the answer)
    res.json({
      question: selectedQuestion.question,
      answerKey: selectedQuestion.answerKey // Optional: Helps backend verify later
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error." });
  }
});

module.exports = router;