const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../utils/authrequest');

// Session validation endpoint
router.get('/validate-session', authorizeRoles('admin', 'user', 'HR', 'REPORTS', 'CNB'), (req, res) => {
    try {
        // Get the user from the request (set by authorizeRoles middleware)
        const user = req.user;
        
        res.status(200).json({ 
            message: 'Session is valid',
            data: {
                userId: user.id,
                role: user.role,
                sessionId: user.sessionId
            }
        });
    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({
            message: 'Error validating session',
            error: 'VALIDATION_ERROR'
        });
    }
});

module.exports = router; 