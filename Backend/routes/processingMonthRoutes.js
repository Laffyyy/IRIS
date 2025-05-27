const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get current processing month
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT dYear, dMonth FROM tbl_processingmonth ORDER BY dProcessingMonth_ID DESC LIMIT 1'
        );
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'No processing month configured' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching processing month:', error);
        res.status(500).json({ message: 'Error fetching processing month' });
    }
});

// Set processing month
router.post('/', async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { month, year, createdBy } = req.body;
        
        if (!month || !year) {
            console.error('Missing month or year in request');
            return res.status(400).json({ message: 'Month and year are required' });
        }

        // Convert month name to number
        const months = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        
        const monthNumber = months[month];
        if (!monthNumber) {
            console.error('Invalid month name:', month);
            return res.status(400).json({ message: 'Invalid month name' });
        }

        const yearNumber = parseInt(year);
        if (isNaN(yearNumber)) {
            console.error('Invalid year:', year);
            return res.status(400).json({ message: 'Invalid year' });
        }

        // Validate future date
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (yearNumber > currentYear || (yearNumber === currentYear && monthNumber > currentMonth)) {
            console.error('Attempt to set future date:', { monthNumber, yearNumber });
            return res.status(400).json({ message: 'Cannot set processing month to a future date' });
        }

        console.log('Inserting processing month:', { monthNumber, yearNumber });
        // Insert new processing month
        const [result] = await db.query(
            'INSERT INTO tbl_processingmonth (dYear, dMonth, dCreatedBy, tCreatedAt) VALUES (?, ?, ?, NOW())',
            [yearNumber, monthNumber, createdBy]
        );
        console.log('Insert result:', result);

        res.json({ message: 'Processing month set successfully' });
    } catch (error) {
        console.error('Error setting processing month:', error);
        res.status(500).json({ 
            message: 'Error setting processing month',
            error: error.message 
        });
    }
});

module.exports = router; 