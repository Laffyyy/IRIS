// routes/clientManagementRoutes.js
const express = require('express');
const router = express.Router();
const ClientManagementController = require('../controllers/clientManagementController');

const clientManagementController = new ClientManagementController();

router.post('/add', (req, res) => clientManagementController.addClient(req, res));
router.get('/getAll', (req, res) => clientManagementController.getClients(req, res));
router.put('/update', (req, res) => clientManagementController.updateClient(req, res));
router.delete('/delete', (req, res) => clientManagementController.deleteClient(req, res));

module.exports = router;