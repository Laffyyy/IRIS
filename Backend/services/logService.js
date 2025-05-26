const db = require('../config/db');

exports.logAdminAction = async ({ dActionLocation_ID, dActionLocation, dActionType, dActionBy }) => {
    try {
        console.log('Logging admin action with data:', { dActionLocation_ID, dActionLocation, dActionType, dActionBy });
        
        const sql = `
            INSERT INTO tbl_logs_admin 
            (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        const result = await db.query(sql, [dActionLocation_ID, dActionLocation, dActionType, dActionBy]);
        console.log('Log entry created:', result);
        return result;
    } catch (error) {
        console.error('Error in logAdminAction:', error);
        throw new Error(`Failed to log admin action: ${error.message}`);
    }
};