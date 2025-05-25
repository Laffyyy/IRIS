const LoginService = require('../services/loginService'); 

class LoginController {
    constructor() {
        this.loginService = new LoginService();
    }
    async login(req, res) {
        console.log('Login request received:', {
            body: req.body,
            headers: req.headers,
            method: req.method,
            url: req.url
        });

        try {
            const { userID, password, otp, bypassOtp, passwordChanged } = req.body; //PJJ I ADDED THE BYPASSOTP AND PASSWORD CHANGED
            
            if (!userID || !password) {
                console.log('Missing credentials:', { userID: !!userID, password: !!password });
                return res.status(400).json({ 
                    message: 'User ID and password are required' 
                });
            }


            //PJ I ADDED THIS
            console.log('Attempting login for user:', userID);
            const result = await this.loginService.loginUser(userID, password, otp, {
                bypassOtp: bypassOtp || false,
                passwordChanged: passwordChanged || false
            });
            console.log('Login result:', { 
                hasToken: !!result.token,
                message: result.message,
                requiresOtp: !otp && result.message === 'OTP sent to your registered email',
                bypassOtp: !!bypassOtp
            });
            
            
            // If OTP is required but not provided
            if (!otp && result.message === 'OTP sent to your registered email') {
                return res.status(200).json({ 
                    message: 'OTP required',
                    data: result 
                });
            }

            // If login is successful
            if (result.token) {
                return res.status(200).json({ 
                    message: 'Login successful', 
                    data: result 
                });
            }

            // If we get here, something went wrong
            console.log('Login failed - no token and no OTP required');
            return res.status(401).json({ 
                message: 'Invalid username or password' 
            });
        } catch (error) {
            console.error('Login error:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Handle specific error cases
            if (error.message.includes('Account is locked')) {
                return res.status(403).json({ message: error.message });
            }
            if (error.message.includes('Account is deactivated')) {
                return res.status(403).json({ message: error.message });
            }
            if (error.message.includes('Account has expired')) {
                return res.status(403).json({ message: error.message });
            }
            if (error.message.includes('User not found')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('Invalid password')) {
                return res.status(401).json({ message: error.message });
            }
            
            // Default error response
            return res.status(500).json({ 
                message: 'Internal server error',
                error: error.message 
            });
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
                    minutesLeft: minutesLeft > 0 ? minutesLeft : 0,
                    expirationDate: result.expirationDate // Include the expiration date
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