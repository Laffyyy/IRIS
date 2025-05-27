const express = require('express');
const router = express.Router();
const adminChatbotController = require('../controllers/adminChatbotController');

// Route to handle admin chatbot queries
router.post('/query', adminChatbotController.processQuery);

// Route to get chat history for admin
router.get('/history', adminChatbotController.getChatHistory);

module.exports = router;