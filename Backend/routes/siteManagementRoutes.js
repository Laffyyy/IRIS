const express = require('express');
const router = express.Router();
const SiteManagementController = require('../controllers/siteManagementController');

const siteManagementController = new SiteManagementController();

router.post('/manage', (req, res) => {
  const { operation } = req.body;
  
  switch (operation) {
    case 'add':
      return siteManagementController.addSite(req, res);
    case 'edit':
      return siteManagementController.editSite(req, res);
    case 'deactivate':
      return siteManagementController.deactivateSite(req, res);
    case 'reactivate':
      return siteManagementController.reactivateSite(req, res);
    case 'getAll':
      return siteManagementController.getAllSites(req, res);
    case 'getAllByStatus':
      return siteManagementController.getAllSitesByStatus(req, res);
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
    case 'getExistingAssignments':
      return siteManagementController.getExistingAssignments(req, res);
    case 'bulkDeactivateSites':
      return siteManagementController.bulkDeactivateSites(req, res);
    case 'bulkReactivateSites':
      return siteManagementController.bulkReactivateSites(req, res);
    case 'bulkDeleteClientSiteAssignments':
      return siteManagementController.bulkDeleteClientSiteAssignments(req, res);
    case 'bulkAddClientsToSite':
      return siteManagementController.bulkAddClientsToSite(req, res);
    case 'getAvailableClients':
      return siteManagementController.getAvailableClients(req, res);
    case 'deactivateClientSite':
      return siteManagementController.deactivateClientSite(req, res);
    case 'reactivateClientSite':
      return siteManagementController.reactivateClientSite(req, res);
    case 'getClientSitesByStatus':
      return siteManagementController.getClientSitesByStatus(req, res);
    case 'bulkDeactivateClientSites':
      return siteManagementController.bulkDeactivateClientSites(req, res);
    case 'bulkReactivateClientSites':
      return siteManagementController.bulkReactivateClientSites(req, res);
    default:
      return res.status(400).json({ 
        message: 'Invalid operation type. Valid operations include "add", "edit", "deactivate", "reactivate", "getAll", "getAllByStatus", "getClients", "addClientToSite", "getSiteClients", "removeClientFromSite", "updateClientSite", "getClientLobs", "getExistingAssignments", "bulkDeactivateSites", "bulkReactivateSites", "bulkDeleteClientSiteAssignments", "bulkAddClientsToSite", and "getAvailableClients"' 
      });
  }
});

module.exports = router;