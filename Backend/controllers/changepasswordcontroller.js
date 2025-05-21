const ChangePasswordService = require('../services/changePasswordService');

class ChangePasswordController {
    constructor() {
        this.ChangePasswordService = new ChangePasswordService();
    }

    async firstLogin(req, res) {
        try {
            const { userId, newPassword, securityQuestions } = req.body;
            console.log('Processing first login for user:', userId);
          
            const result = await this.ChangePasswordService.updateFirstTimeUser(userId, newPassword, securityQuestions);
            res.status(200).json({ message: 'Profile updated successfully', data: result });
        } catch (error) {
            console.error('Error in firstLogin:', error);
            res.status(500).json({ 
                message: 'Failed to update profile', 
                error: error.message 
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { userId, newPassword } = req.body;
            const result = await this.ChangePasswordService.changePassword(userId, newPassword);
            res.status(200).json({ message: 'Password changed successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    async changeSecurityQuestions(req, res) {
        try {
            const { userId, securityQuestions } = req.body;
            const result = await this.ChangePasswordService.changeSecurityQuestions(userId, securityQuestions);
            res.status(200).json({ message: 'Security questions updated successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update security questions', error: error.message });
        }
    }

    async getSecurityQuestions(req, res) {
        try {
            const questions = await this.ChangePasswordService.getSecurityQuestions();
            res.status(200).json({ questions });
        } catch (error) {
            console.error('Error fetching security questions:', error);
            res.status(500).json({ 
                message: 'Failed to fetch security questions',
                error: error.message 
            });
        }
    }
}

module.exports = ChangePasswordController;