const LoginService = require('../services/loginService'); 

class LoginController {
    constructor() {
        this.loginService = new LoginService();
    }

    async login(req, res) {
        try {
            
            const { userId , password, otp } = req.body;
            const result = await this.loginService.loginUser(userId, password,otp);
            if (result) {
                res.status(200).json({ message: 'Login successful', data: result });
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    async register(req, res) {
        try {
            const userData = req.body;
            const result = await this.loginService.registerUser(userData);
            res.status(201).json({ message: 'User registered successfully', userId: result });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    async firstLogin(req, res) {
        try {
            const { userId, newPassword } = req.body;
            const result = await this.loginService.changePassword(userId, newPassword);
            res.status(200).json({ message: 'Password changed successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    //For checking if the user is first time login or not
    async checkUserStatus(req, res) {
        try {
            const { userId, otp } = req.body;
            
            // Call the service method to check the user status
            const status = await this.loginService.getUserStatus(userId);
            
            // Return the status to the frontend
            res.status(200).json({ 
                status: status,
                isFirstTimeLogin: status === 'FIRST-TIME'
            });
        } catch (error) {
            console.error(`[ERROR] checkUserStatus failed:`, error);
            console.error(`[ERROR] Stack trace:`, error.stack);
            res.status(500).json({ 
                message: 'Error checking user status', 
                error: error.message 
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { userId, newPassword } = req.body;
            const result = await this.loginService.changePassword(userId, newPassword);
            res.status(200).json({ message: 'Password changed successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    
}

module.exports = LoginController;