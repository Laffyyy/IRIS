const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function verifySession(userId, sessionId, table) {
    try {
        // Immediately check if the session exists and is valid
        const [rows] = await db.query(
            `SELECT dSession_ID, tLast_Login FROM ${table} WHERE dUser_ID = ? AND dSession_ID = ?`,
            [userId, sessionId]
        );

        // If no valid session found, return false immediately
        if (rows.length === 0) {
            console.log('No valid session found in database');
            // Clear any invalid session data
            await db.query(
                `UPDATE ${table} SET dSession_ID = NULL, dDevice_Info = NULL WHERE dUser_ID = ?`,
                [userId]
            );
            return false;
        }

        // Check if the session is too old (e.g., more than 24 hours)
        const lastLogin = new Date(rows[0].tLast_Login);
        const now = new Date();
        const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

        if (hoursSinceLastLogin > 24) {
            console.log('Session is too old');
            // Clear the expired session
            await db.query(
                `UPDATE ${table} SET dSession_ID = NULL, dDevice_Info = NULL WHERE dUser_ID = ?`,
                [userId]
            );
            return false;
        }

        // Update last login time
        await db.query(
            `UPDATE ${table} SET tLast_Login = NOW() WHERE dUser_ID = ? AND dSession_ID = ?`,
            [userId, sessionId]
        );

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

            // Check roles - handle both role and roles fields
            const userRoles = [];
            if (decoded.roles) {
                userRoles.push(...(Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles]));
            }
            if (decoded.role) {
                userRoles.push(decoded.role);
            }
            
            const hasRole = allowedRoles.some(role => userRoles.includes(role));
            
            if (!hasRole) {
                return res.status(403).json({
                    message: 'Access forbidden. Insufficient permissions.',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            req.user = decoded;
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(401).json({
                message: 'Invalid token',
                error: 'INVALID_TOKEN'
            });
        }
    };
}

module.exports = { authorizeRoles };
