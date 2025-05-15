const db = require('../config/db');

exports.getSecurityQuestions = (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const query = `
    SELECT dSecurity_Question1, dSecurity_Question2, dSecurity_Question3
    FROM users
    WHERE user_email = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, questions: results[0] });
  });
};
