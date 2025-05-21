const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiManagementController');

// GET all KPIs
router.get('/', kpiController.getAllKPIs);

// GET single KPI by ID
router.get('/:id', kpiController.getKPIById);

// POST create new KPI
router.post('/', kpiController.createKPI);

// PUT update KPI
router.put('/:id', kpiController.updateKPI);

// DELETE KPI
router.delete('/:id', kpiController.deleteKPI);

// PUT deactivate KPI
router.put('/:id/deactivate', kpiController.deactivateKPI);

// PUT reactivate KPI
router.put('/:id/reactivate', kpiController.reactivateKPI);

module.exports = router;