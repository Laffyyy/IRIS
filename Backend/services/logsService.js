// Update your existing file to include the new method
const db = require('../config/db');

class LogsService {
    async getAdminLogs(filters = {}) {
        try {
            // Your existing getAdminLogs code here...
            let query = `
                SELECT 
                    dLog_ID,      
                    dActionLocation_ID, 
                    dActionLocation, 
                    dActionType, 
                    dActionBy, 
                    tActionAt
                FROM tbl_logs_admin 
            `;
            
            // Existing filtering code...
            const queryParams = [];
            const conditions = [];

            if (filters?.startDate && filters?.endDate) {
                conditions.push('tActionAt BETWEEN ? AND ?');
                queryParams.push(filters.startDate, filters.endDate);
            }

            if (filters?.location && filters.location !== 'All') {
                conditions.push('dActionLocation = ?');
                queryParams.push(filters.location);
            }

            if (filters?.actionType && filters.actionType !== 'All') {
                conditions.push('dActionType = ?');
                queryParams.push(filters.actionType);
            }

            if (filters?.searchTerm) {
                conditions.push('(dActionBy LIKE ? OR dActionLocation LIKE ? OR dActionType LIKE ? OR dActionLocation_ID LIKE ?)');
                const searchParam = `%${filters.searchTerm}%`;
                queryParams.push(searchParam, searchParam, searchParam, searchParam);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY tActionAt DESC';
            
            // For debugging
            console.log('SQL Query:', query);
            console.log('Query params:', queryParams);

            const [rows] = await db.query(query, queryParams);
            console.log('Rows returned:', rows.length);
            return rows;
        } catch (error) {
            console.error('Error in logsService.getAdminLogs:', error);
            throw error;
        }
    }

    // New method for User Access logs
    async getUserAccessLogs(filters = {}) {
        try {
            let query = `
                SELECT 
                    dLog_ID, 
                    dUser_ID, 
                    dActionType, 
                    tTimeStamp
                FROM tbl_logs_useraccess 
            `;

            const queryParams = [];
            const conditions = [];

            // Add filters
            if (filters?.startDate && filters?.endDate) {
                conditions.push('tTimeStamp BETWEEN ? AND ?');
                queryParams.push(filters.startDate, filters.endDate);
            }

            if (filters?.actionType && filters.actionType !== 'All') {
                conditions.push('dActionType = ?');
                queryParams.push(filters.actionType);
            }

            if (filters?.searchTerm) {
                conditions.push('(dUser_ID LIKE ? OR dActionType LIKE ?)');
                const searchParam = `%${filters.searchTerm}%`;
                queryParams.push(searchParam, searchParam);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY tTimeStamp DESC';
            
            // For debugging
            console.log('SQL Query:', query);
            console.log('Query params:', queryParams);

            const [rows] = await db.query(query, queryParams);
            console.log('User access logs returned:', rows.length);
            return rows;
        } catch (error) {
            console.error('Error in logsService.getUserAccessLogs:', error);
            throw error;
        }
    }
}

module.exports = LogsService;