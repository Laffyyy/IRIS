const express = require('express');
const router = express.Router();
const LoginController = require('../controllers/logincontroller'); // Import the controller
const ChangePasswordController = require('../controllers/changepasswordcontroller');

router.post('/firstlogin', (req, res) => loginController.firstLogin(req, res));
router.post('/checkStatus', (req, res) => loginController.checkUserStatus(req, res));