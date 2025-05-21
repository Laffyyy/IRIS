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
}

module.exports = LogsController;