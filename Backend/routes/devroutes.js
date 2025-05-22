const express = require('express');
const router = express.Router();

const DevController = require('../controllers/devcontroller'); // Import the controller

const devController = new DevController(); // Instantiate the class

router.post('/createAdminUser', (req, res) => devController.createAdminUser(req, res));

module.exports = router;