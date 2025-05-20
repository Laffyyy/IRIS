const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../utils/authrequest');

// Session validation endpoint
router.get('/validate-session', authorizeRoles('admin', 'user', 'HR', 'REPORTS', 'CNB'), (req, res) => {
    res.status(200).json({ message: 'Session is valid' });
});

module.exports = router; 