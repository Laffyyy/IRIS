const ChangePasswordService = require('../services/changePasswordService');

class ChangePasswordController {
    constructor() {
        this.ChangePasswordService = new ChangePasswordService();
    }
    // Add this method to the ChangePasswordController class
    async checkUserStatus(req, res) {
        try {
            const { userID } = req.body;
            if (!userID) {
                return res.status(400).json({ message: 'User ID is required' });
            }
            
            // Call a new service method to fetch user status
            const status = await this.ChangePasswordService.getUserStatus(userID);
            
            res.status(200).json({ status });
        } catch (error) {
            console.error('Error checking user status:', error);
            res.status(500).json({ 
                message: 'Failed to check user status', 
                error: error.message 
            });
        }
    }

    async verifyCredentials(req, res) {
        try {
            const { userID, password } = req.body;
            
            if (!userID || !password) {
                return res.status(400).json({ 
                    success: false,
                    message: 'User ID and password are required'
                });
            }
            
            const result = await this.ChangePasswordService.verifyCredentials(userID, password);
            
            res.status(200).json({
                success: true,
                status: result.status
            });
            
        } catch (error) {
            console.error('Error verifying credentials:', error);
            
            if (error.message === 'User not found' || error.message === 'Invalid password') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to verify credentials',
                error: error.message
            });
        }
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