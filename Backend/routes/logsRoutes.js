const express = require('express');
const router = express.Router();
const LogsController = require('../controllers/logsController');

const logsController = new LogsController();

// Explicitly define the POST route
router.post('/', (req, res) => {
    console.log("Received logs request with body:", req.body); // Add debug logging
    const { operation } = req.body;
    
    switch(operation) {
        case 'viewadminlogs':
            return logsController.getAdminLogs(req, res);
        default:
            return res.status(400).json({ 
                success: false, 
                message: `Unknown operation: ${operation}` 
            });
    }
});

module.exports = router;