const express = require('express');
const router = express.Router();
const { getSecurityQuestions } = require('../controllers/securitycontrollers');

router.get('/security-questions', getSecurityQuestions);

module.exports = router;
