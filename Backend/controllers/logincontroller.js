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

    async checkPasswordExpiration(req, res) {
        try {
            const { userId } = req.body;
            const isExpired = await this.loginService.checkPasswordExpiration(userId);
            
            res.status(200).json({ isExpired });
        } catch (error) {
            res.status(500).json({ 
                message: 'Error checking password expiration', 
                error: error.message 
            });
        }
    }
}

module.exports = LoginController;