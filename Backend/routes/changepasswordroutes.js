const express = require('express');
const router = express.Router();
const ChangePasswordController = require('../controllers/changepasswordcontroller');

const changepasswordController = new ChangePasswordController(); // Instantiate the class

router.post('/firstlogin', (req, res) => changepasswordController.firstLogin(req, res));

module.exports = router;