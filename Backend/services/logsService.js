const db = require('../config/db');

class LogsService {
    async getAdminLogs(filters = {}) {
        try {
            // Start building the query with correct table name and column order
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

            const queryParams = [];
            const conditions = [];

            // Add filters as before...
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
                conditions.push('(dActionBy LIKE ? OR dActionLocation LIKE ? OR dActionType LIKE ?)');
                const searchParam = `%${filters.searchTerm}%`;
                queryParams.push(searchParam, searchParam, searchParam);
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
}

module.exports = LogsService;