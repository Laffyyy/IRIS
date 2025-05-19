const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function verifySession(userId, sessionId, table) {
    try {
        // Immediately check if the session exists and is valid
        const [rows] = await db.query(
            `SELECT dSession_ID FROM ${table} WHERE dUser_ID = ? AND dSession_ID = ?`,
            [userId, sessionId]
        );

        // If no valid session found, return false immediately
        if (rows.length === 0) {
            // Clear any invalid session data
            await db.query(
                `UPDATE ${table} SET dSession_ID = NULL, dDevice_Info = NULL WHERE dUser_ID = ?`,
                [userId]
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verifying session:', error);
        return false;
    }
}

function authorizeRoles(...allowedRoles) {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: 'Access denied. No token provided.',
                error: 'NO_TOKEN'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check token expiration
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return res.status(401).json({
                    message: 'Token has expired. Please login again.',
                    error: 'TOKEN_EXPIRED'
                });
            }
            
            // Determine the table based on role
            const table = decoded.role === 'admin' ? 'tbl_admin' : 'tbl_login';
            
            // Verify session ID immediately
            const isValidSession = await verifySession(decoded.id, decoded.sessionId, table);
            
            if (!isValidSession) {
                return res.status(401).json({
                    message: 'Session invalid. Please login again.',
                    error: 'INVALID_SESSION'
                });
            }

            // Check roles
            const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
            const hasRole = allowedRoles.some(role => userRoles.includes(role));
            
            if (!hasRole) {
                return res.status(403).json({
                    message: 'Access forbidden. Insufficient permissions.',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            req.user = decoded;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Token has expired. Please login again.',
                    error: 'TOKEN_EXPIRED'
                });
            }
            return res.status(400).json({
                message: 'Invalid token.',
                error: 'INVALID_TOKEN'
            });
        }
    };
}

module.exports = { authorizeRoles };
