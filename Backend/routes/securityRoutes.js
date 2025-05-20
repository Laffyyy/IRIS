const express = require('express');
const router = express.Router();
const { getSecurityQuestionsByEmail } = require('../services/securityService');

router.get('/get-security-question', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const rows = await getSecurityQuestionsByEmail(email);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No security questions found for this email." });
    }

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