const express = require('express');
const router = express.Router();
const SiteManagementController = require('../controllers/siteManagementController');

const siteManagementController = new SiteManagementController(); // Instantiate the class

router.post('/manage', (req, res) => {
    const { operation } = req.body;
    
    // Route to the appropriate controller method based on operation
    switch (operation) {
      case 'add':
        return siteManagementController.addSite(req, res);
      case 'edit':
        return siteManagementController.editSite(req, res);
      case 'delete':
        return siteManagementController.deleteSite(req, res);
      case 'getAll':
        return siteManagementController.getAllSites(req, res);
      case 'getClients':
        return siteManagementController.getAllClients(req, res);
      case 'addClientToSite':
        return siteManagementController.addClientToSite(req, res);
      case 'getClientSiteMappings':
        return siteManagementController.getClientSiteMappings(req, res);
      default:
        return res.status(400).json({ 
          message: 'Invalid operation type. Must be "add", "edit", or "delete"' 
        });
    }
  });

module.exports = router;
