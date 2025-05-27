// Update your existing file to include the new method
const LogsService = require('../services/logsService');

class LogsController {
    constructor() {
        this.logsService = new LogsService();
    }

    async getAdminLogs(req, res) {
        try {
            const { filters } = req.body;
            const logs = await this.logsService.getAdminLogs(filters);
            res.status(200).json({ success: true, logs });
        } catch (error) {
            console.error('Error in logsController.getAdminLogs:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to retrieve admin logs',
                error: error.message
            });
        }
    }

    // New method for User Access logs
    async getUserAccessLogs(req, res) {
        try {
            const { filters } = req.body;
            const logs = await this.logsService.getUserAccessLogs(filters);
            res.status(200).json({ success: true, logs });
        } catch (error) {
            console.error('Error in logsController.getUserAccessLogs:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to retrieve user access logs',
                error: error.message
            });
        }
    }
}

module.exports = LogsController;