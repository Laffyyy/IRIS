const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/UserController');

// Route to get all users
router.get('/users', getAllUsers);

module.exports = router;