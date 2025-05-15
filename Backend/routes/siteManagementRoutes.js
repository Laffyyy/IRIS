const express = require('express');
const router = express.Router();
const SiteManagementController = require('../controllers/siteManagementController');

const siteManagementController = new SiteManagementController(); // Instantiate the class

router.post('/addsite', (req, res) => siteManagementController.addSite(req, res));
router.post('/editsite', (req, res) => siteManagementController.editSite(req, res));
router.post('/deletesite', (req, res) => siteManagementController.deleteSite(req, res));

module.exports = router;
