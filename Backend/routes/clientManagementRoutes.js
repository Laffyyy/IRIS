// routes/clientManagementRoutes.js
const express = require('express');
const router = express.Router();
const ClientManagementController = require('../controllers/clientManagementController');

const clientManagementController = new ClientManagementController();

// Client routes
router.post('/add', (req, res) => clientManagementController.addClient(req, res));
router.get('/getAll', (req, res) => clientManagementController.getClients(req, res));
router.put('/update', (req, res) => clientManagementController.updateClient(req, res));
router.post('/update', (req, res) => clientManagementController.updateClient(req, res));
router.delete('/delete', (req, res) => clientManagementController.deleteClient(req, res));
router.post('/deactivate', (req, res) => clientManagementController.deactivateClient(req, res));

// LOB routes
router.post('/lob/add', (req, res) => clientManagementController.addLOB(req, res));
router.put('/lob/update', (req, res) => clientManagementController.updateLOB(req, res));
router.post('/lob/update', (req, res) => clientManagementController.updateLOB(req, res));
router.delete('/lob/delete', (req, res) => clientManagementController.deleteLOB(req, res));
router.post('/lob/deactivate', (req, res) => clientManagementController.deactivateLOB(req, res));

// Sub LOB routes
router.post('/sublob/add', (req, res) => clientManagementController.addSubLOB(req, res));
router.put('/sublob/update', (req, res) => clientManagementController.updateSubLOB(req, res));
router.post('/sublob/update', (req, res) => clientManagementController.updateSubLOB(req, res));
router.delete('/sublob/delete', (req, res) => clientManagementController.deleteSubLOB(req, res));
router.post('/sublob/deactivate', (req, res) => clientManagementController.deactivateSubLOB(req, res));

module.exports = router;