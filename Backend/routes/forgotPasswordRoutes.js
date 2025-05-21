const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPasswordController');

// POST /api/password/forgot
router.post('/forgot', forgotPasswordController.resetPassword);

module.exports = router;
