const express = require('express');
const router = express.Router();
const LoginController = require('../controllers/logincontroller'); // Import the controller

const loginController = new LoginController(); // Instantiate the class

router.post('/', (req, res) => loginController.login(req, res));
router.post('/register', (req, res) => loginController.register(req, res));
router.post('/fetchStatus', (req, res) => loginController.checkUserStatus(req, res));

module.exports = router;