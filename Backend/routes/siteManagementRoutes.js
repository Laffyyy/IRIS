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
      case 'getSiteClients':
        return siteManagementController.getSiteClients(req, res);
      case 'removeClientFromSite':
        return siteManagementController.removeClientFromSite(req, res);
      case 'updateClientSite':
        return siteManagementController.updateClientSite(req, res);
      case 'getClientLobs':
        return siteManagementController.getClientLobs(req, res);
      case 'getExistingAssignments': // Add this case
        return siteManagementController.getExistingAssignments(req, res);
      case 'bulkDeleteSites':
        return siteManagementController.bulkDeleteSites(req, res);
      case 'bulkDeleteClientSiteAssignments':
        return siteManagementController.bulkDeleteClientSiteAssignments(req, res);
      case 'bulkAddClientsToSite':
        return siteManagementController.bulkAddClientsToSite(req, res);
      case 'getAvailableClients':
        return siteManagementController.getAvailableClients(req, res);
      default:
        return res.status(400).json({ 
          message: 'Invalid operation type. Valid operations include "add", "edit", "delete", "getAll", "getClients", "addClientToSite", "getSiteClients", "removeClientFromSite", "updateClientSite", "getClientLobs", "getExistingAssignments", "bulkDeleteSites", "bulkDeleteClientSiteAssignments", "bulkAddClientsToSite", and "getAvailableClients"' 
        });
    }
});

module.exports = router;