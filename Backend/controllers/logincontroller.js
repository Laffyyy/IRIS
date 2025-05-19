const LoginService = require('../services/loginService'); 
const jwt = require('jsonwebtoken');

class LoginController {
    constructor() {
        this.loginService = new LoginService();
    }

    async login(req, res) {
        try {
            const { userId, password, otp } = req.body;
            
            // Validate required fields
            if (!userId || !password) {
                return res.status(400).json({ 
                    message: 'User ID and password are required',
                    error: 'Missing credentials'
                });
            }

            const result = await this.loginService.loginUser(userId, password, otp, req);
            
            // Handle existing session case
            if (result.existingSession) {
                return res.status(200).json({ 
                    message: result.message,
                    data: { 
                        existingSession: result.existingSession,
                        userType: result.userType
                    }
                });
            }

            // Handle successful login
            if (result.token) {
                return res.status(200).json({ 
                    message: result.message,
                    data: result
                });
            }

            // Handle OTP sent case
            return res.status(200).json({ 
                message: result.message
            });

        } catch (error) {
            console.error('Login error:', error.message);
            
            // Handle specific error cases
            if (error.message === 'Invalid user ID or password') {
                return res.status(401).json({ 
                    message: 'Invalid user ID or password',
                    error: 'Authentication failed'
                });
            }
            
            if (error.message === 'Account is deactivated') {
                return res.status(403).json({ 
                    message: 'Your account has been deactivated',
                    error: 'Account deactivated'
                });
            }
            
            if (error.message === 'Account has expired') {
                return res.status(403).json({ 
                    message: 'Your account has expired',
                    error: 'Account expired'
                });
            }

            // Handle other errors
            return res.status(500).json({ 
                message: 'An error occurred during login',
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

    async firstLogin(req, res) {
        try {
            const { userId, newPassword } = req.body;
            const result = await this.loginService.changePassword(userId, newPassword);
            res.status(200).json({ message: 'Password changed successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
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

    async confirmSession(req, res) {
        try {
            const { userId, userType } = req.body;
            
            if (!userId || !userType) {
                return res.status(400).json({
                    message: 'User ID and user type are required',
                    error: 'Missing required fields'
                });
            }

            const result = await this.loginService.confirmSessionTermination(userId, userType);
            
            if (!result) {
                return res.status(500).json({
                    message: 'Failed to terminate session',
                    error: 'Session termination failed'
                });
            }

            return res.status(200).json({
                message: 'Session terminated successfully',
                data: result
            });
        } catch (error) {
            console.error('Session confirmation error:', error);
            return res.status(500).json({ 
                message: 'Failed to confirm session termination',
                error: error.message
            });
        }
    }

    async validateSession(req, res) {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) {
                return res.status(401).json({
                    message: 'No token provided',
                    error: 'NO_TOKEN'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const table = decoded.role === 'admin' ? 'tbl_admin' : 'tbl_login';
            
            const isValidSession = await this.loginService.verifySession(decoded.id, decoded.sessionId, table);
            
            if (!isValidSession) {
                return res.status(401).json({
                    message: 'Invalid session',
                    error: 'INVALID_SESSION'
                });
            }

            return res.status(200).json({
                message: 'Session is valid',
                data: {
                    userId: decoded.id,
                    role: decoded.role
                }
            });
        } catch (error) {
            console.error('Session validation error:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Token has expired',
                    error: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({
                message: 'Invalid token',
                error: 'INVALID_TOKEN'
            });
        }
    }
}

module.exports = LoginController;