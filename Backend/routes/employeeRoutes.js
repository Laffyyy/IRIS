const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const employeeService = require('../services/employeeService');

// Get all employees
router.get('/', employeeController.getAllEmployees);

// Get employee by ID
router.get('/:id', employeeController.getEmployeeById);

// Create new employee
router.post('/', employeeController.createEmployee);

// Update employee
router.put('/:id', employeeController.updateEmployee);

// Delete employee
router.delete('/:id', employeeController.deleteEmployee);

// Get all active sites
router.get('/sites/active', async (req, res) => {
    try {
        const sites = await employeeService.getActiveSites();
        res.json({
            success: true,
            data: sites
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router; 