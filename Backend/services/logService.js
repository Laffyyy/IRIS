const db = require('../config/db');

exports.logAdminAction = async ({ dActionLocation_ID, dActionLocation, dActionType, dActionBy }) => {
    try {
        console.log('Starting log admin action...');
        
        // Validate required fields
        if (!dActionLocation_ID || !dActionLocation || !dActionType || !dActionBy) {
            throw new Error('Missing required fields for logging');
        }

        const sql = `
            INSERT INTO tbl_logs_admin 
            (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        const params = [dActionLocation_ID, dActionLocation, dActionType, dActionBy];
        console.log('Executing query with params:', params);

        const [result] = await db.execute(sql, params);
        
        if (result && result.affectedRows > 0) {
            console.log('Log entry created successfully');
            return result;
        } else {
            throw new Error('No rows were inserted');
        }
    } catch (error) {
        console.error('Database error in logAdminAction:', error);
        throw error;
    }
};