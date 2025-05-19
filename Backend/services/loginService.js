const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../models/login');
const OtpService = require('./otpService'); // Import the OtpService
const crypto = require('crypto');

class LoginService {
    constructor() {
        this.otpService = new OtpService(); // Initialize OtpService
    }

    // Generate a unique session ID
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Get device info from request
    getDeviceInfo(req) {
        const userAgent = req.headers['user-agent'] || '';
        const ip = req.ip || req.connection.remoteAddress;
        return `${userAgent} - ${ip}`;
    }

    // Add method to invalidate all other sessions
    async invalidateOtherSessions(userID, table, currentSessionId) {
        try {
            await db.query(
                `UPDATE ${table} SET dSession_ID = NULL, dDevice_Info = NULL WHERE dUser_ID = ? AND dSession_ID != ?`,
                [userID, currentSessionId]
            );
        } catch (error) {
            console.error('Error invalidating sessions:', error);
            throw error;
        }
    }

    // Add method to get current session version
    async getSessionVersion(userID, table) {
        try {
            const [rows] = await db.query(
                `SELECT session_version FROM ${table} WHERE dUser_ID = ?`,
                [userID]
            );
            return rows[0]?.session_version || 0;
        } catch (error) {
            console.error('Error getting session version:', error);
            throw error;
        }
    }

    async loginUser(userID, password, otp = null, req = null) {
        try {
            let user = null;
            let table = null;
            let userType = null;

            // Step 1: Check if the user exists in tbl_login
            const [loginRows] = await db.query('SELECT * FROM tbl_login WHERE dUser_ID = ?', [userID]);
            if (loginRows.length > 0) {
                user = loginRows[0];
                table = 'tbl_login';
                userType = user.dUser_Type || 'user';
            } else {
                // Step 2: Check if the user exists in tbl_admin
                const [adminRows] = await db.query('SELECT * FROM tbl_admin WHERE dUser_ID = ?', [userID]);
                if (adminRows.length > 0) {
                    user = adminRows[0];
                    table = 'tbl_admin';
                    userType = 'admin';
                }
            }

            if (!user) {
                throw new Error('Invalid user ID or password');
            }

            // Step 3: Verify the password
            let isMatch = false;
            if (table === 'tbl_login') {
                if (!user.dPassword1_hash) {
                    throw new Error('Invalid user ID or password');
                }
                isMatch = await bcrypt.compare(password, user.dPassword1_hash);
            } else if (table === 'tbl_admin') {
                if (!user.dPassword1_hash) {
                    throw new Error('Invalid user ID or password');
                }
                isMatch = await bcrypt.compare(password, user.dPassword1_hash);
            }

            if (!isMatch) {
                throw new Error('Invalid user ID or password');
            }

            // Step 4: Check the user's status
            if (user.dStatus && user.dStatus === 'DEACTIVATED') {
                throw new Error('Account is deactivated');
            }
            if (user.dStatus && user.dStatus === 'EXPIRED') {
                throw new Error('Account has expired');
            }

            // Step 5: Handle OTP verification
            if (otp) {
                const otpService = new OtpService();
                const otpVerificationResult = await otpService.verifyOtp(user.dUser_ID, otp);

                if (otpVerificationResult.message === 'OTP expired. A new OTP has been sent to your registered email or phone.') {
                    return otpVerificationResult;
                }

                // Check for existing session
                if (user.dSession_ID && user.dDevice_Info) {
                    return {
                        message: 'Existing session detected',
                        existingSession: {
                            deviceInfo: user.dDevice_Info,
                            lastLogin: user.tLast_Login
                        },
                        userType: userType
                    };
                }

                // Generate new session ID
                const sessionId = this.generateSessionId();
                const deviceInfo = req ? this.getDeviceInfo(req) : 'Unknown Device';

                // Immediately invalidate all other sessions for this user
                await db.query(
                    `UPDATE ${table} SET dSession_ID = NULL, dDevice_Info = NULL WHERE dUser_ID = ?`,
                    [userID]
                );

                // Generate token with session ID
                const token = jwt.sign(
                    { 
                        id: user.dUser_ID, 
                        role: userType,
                        sessionId: sessionId,
                        iat: Math.floor(Date.now() / 1000),
                        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
                    },
                    process.env.JWT_SECRET
                );

                // Update session info and last login time
                await db.query(
                    `UPDATE ${table} SET dSession_ID = ?, dDevice_Info = ?, tLast_Login = NOW() WHERE dUser_ID = ?`,
                    [sessionId, deviceInfo, userID]
                );

                return { 
                    message: 'Login successful', 
                    token, 
                    user: { 
                        id: user.dUser_ID, 
                        email: user.dEmail, 
                        status: user.dStatus || userType 
                    } 
                };
            } else {
                const otpService = new OtpService();
                const generatedOtp = await otpService.generateOtp(user.dUser_ID);
                console.log(`Generated OTP for user ${user.dUser_ID}: ${generatedOtp}`);
                return { message: 'OTP sent to your registered email or phone' };
            }
        } catch (error) {
            console.error('Error in loginUser:', error.message);
            throw error;
        }
    }

    async confirmSessionTermination(userId, userType) {
        try {
            const table = userType === 'admin' ? 'tbl_admin' : 'tbl_login';
            
            // First verify the user exists
            const [user] = await db.query(
                `SELECT dUser_ID FROM ${table} WHERE dUser_ID = ?`,
                [userId]
            );

            if (!user || user.length === 0) {
                throw new Error('User not found');
            }

            // Clear the session data
            await db.query(
                `UPDATE ${table} SET dSession_ID = NULL, dDevice_Info = NULL WHERE dUser_ID = ?`,
                [userId]
            );

            return {
                success: true,
                message: 'Session terminated successfully'
            };
        } catch (error) {
            console.error('Error terminating session:', error);
            throw error;
        }
    }

    //wrong file
    async changePassword(userID, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE tbl_login SET dPassword_hash = ? WHERE dUser_ID = ?', [hashedPassword, userID]);
            return { message: 'Password changed successfully' };
        } catch (error) {
            throw error;
        }
    }
    //wrong file
    async changesecurityQuestion(userID, newSecurityQuestions) {
        try {
            const normalizedSecurityAnswers = [
                newSecurityQuestions.Security_Answer,
                newSecurityQuestions.Security_Answer2,
                newSecurityQuestions.Security_Answer3
            ].map(answer => answer.toLowerCase());

            await db.query(
                'UPDATE tbl_login SET dSecurity_Question1 = ?, dSecurity_Question2 = ?, dSecurity_Question3 = ?, dAnswer_1 = ?, dAnswer_2 = ?, dAnswer_3 = ? WHERE dUser_ID = ?',
                [
                    newSecurityQuestions.Security_Question,
                    newSecurityQuestions.Security_Question2,
                    newSecurityQuestions.Security_Question3,
                    normalizedSecurityAnswers[0],
                    normalizedSecurityAnswers[1],
                    normalizedSecurityAnswers[2],
                    userID
                ]
            );
            return { message: 'Security questions updated successfully' };
        } catch (error) {
            throw error;
        }
    }

    

    async registerUser(userData) {
        try {
            // Generate a custom userID
            const date = new Date();
            const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
            
            // Query the database to get the current max ID or count
            const [rows] = await db.query('SELECT COUNT(*) AS count FROM tbl_login');
            const count = rows[0].count + 1; // Increment the count for the new user
            
            const customUserID = `${count.toString().padStart(4, '0')}`;
    
            // Hash the password
            const hashedPassword = await bcrypt.hash(userData.Password, 10);
    
            // Normalize security answers
            const normalizedSecurityAnswers = [
                userData.Security_Answer,
                userData.Security_Answer2,
                userData.Security_Answer3
            ].map(answer => answer.toLowerCase());
    
            // Create the new user object
            const newUser = new login(
                customUserID, // Use the custom userID
                userData.Email,
                hashedPassword,
                userData.user_type,
                userData.Security_Question,
                userData.Security_Question2,
                userData.Security_Question3,
                normalizedSecurityAnswers[0],
                normalizedSecurityAnswers[1],
                normalizedSecurityAnswers[2],
                null,
                'FIRST-TIME', // Default status
                null,
                userData.created_by,
                null
            );
    
            // Insert the new user into the database
            const [result] = await db.query(
                'INSERT INTO tbl_login (dUser_ID, dEmail, dPassword_hash, dUser_Type, dSecurity_Question1, dSecurity_Question2, dSecurity_Question3, dAnswer_1, dAnswer_2, dAnswer_3, dStatus, dCreatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    newUser.userID, // Custom userID
                    newUser.Email,
                    newUser.Password,
                    newUser.user_type,
                    newUser.Security_Question,
                    newUser.Security_Question2,
                    newUser.Security_Question3,
                    newUser.Security_Answer,
                    newUser.Security_Answer2,
                    newUser.Security_Answer3,
                    newUser.status,
                    newUser.created_by
                ]
            );
    
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = LoginService; // Export the class, not an instance