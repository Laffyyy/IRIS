const express = require('express');
const router = express.Router();
const securityQuestionsController = require('../controllers/securityQuestionsController');

// Get user's security questions
router.get('/get-questions', securityQuestionsController.getQuestions);

// Verify security question answers
router.post('/verify-answers', securityQuestionsController.verifyAnswers);

module.exports = router;