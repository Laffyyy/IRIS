const LoginService = require('../services/loginService'); 

class LoginController {
    constructor() {
        this.loginService = new LoginService();
    }
    async login(req, res) {
        try {
            const { userId, password, otp } = req.body;
            const result = await this.loginService.loginUser(userId, password, otp);
            
            // Check if the result indicates an error
            if (result.status === 'error') {
                return res.status(401).json({ message: result.message });
            }
            
            if (result) {
                res.status(200).json({ message: 'Login successful', data: result });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Something went wrong', error: error.message });
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
            const result = await this.loginService.checkPasswordExpiration(userId);
            
            // If result is just a boolean, transform it to include minutes left
            let response = { isExpired: result };
            
            // If the service returns an object with expirationDate, calculate minutes left
            if (result && typeof result === 'object' && result.expirationDate) {
                const now = new Date();
                const expDate = new Date(result.expirationDate);
                const minutesLeft = Math.floor((expDate - now) / (1000 * 60));
                
                response = {
                    isExpired: now >= expDate,
                    minutesLeft: minutesLeft > 0 ? minutesLeft : 0
                };
            }
            
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ 
                message: 'Error checking password expiration', 
                error: error.message 
            });
        }
    }
}

module.exports = LoginController;