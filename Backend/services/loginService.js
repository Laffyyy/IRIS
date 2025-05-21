const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const login = require('../models/login');
const OtpService = require('./otpservice'); // Import the OtpService


class LoginService {
    constructor() {
        this.otpService = new OtpService(); // Initialize OtpService
        this.MAX_FAILED_ATTEMPTS = 3; // Increased from 3 to 
    }

    
    async loginUser(userID, password, otp = null) {
        console.log('LoginService.loginUser called:', { userID, hasPassword: !!password, hasOtp: !!otp });
        try {
            let user = null;
            let table = null;

            // Check if the user exists in tbl_login
            console.log('Checking tbl_login for user:', userID);
            const [loginRows] = await db.query('SELECT * FROM tbl_login WHERE dUser_ID = ?', [userID]);
            if (loginRows.length > 0) {
                console.log('User found in tbl_login');
                user = loginRows[0];
                table = 'tbl_login';
            } else {
                console.log('User not found in tbl_login, checking tbl_admin');
                const [adminRows] = await db.query('SELECT * FROM tbl_admin WHERE dUser_ID = ?', [userID]);
                if (adminRows.length > 0) {
                    console.log('User found in tbl_admin');
                    user = adminRows[0];
                    table = 'tbl_admin';
                    user.dUser_Type = 'admin'; // Set user type for admin
                }
            }

            if (!user) {
                console.log('User not found in any table');
                throw new Error('User not found');
            }

            // Check account status
            console.log('Checking account status:', user.dStatus);
            if (user.dStatus === 'DEACTIVATED' || user.dStatus === 'LOCKED') {
                throw new Error('Account is deactivated. Please contact support to reactivate.');
            }

            // Verify password
            let isMatch = false;
            if (table === 'tbl_login' || table === 'tbl_admin') {
                if (!user.dPassword1_hash) {
                    console.error('Password hash missing for user:', userID);
                    throw new Error('Password hash is missing');
                }
                
                try {
                    console.log('Comparing passwords for user:', userID);
                    isMatch = await bcrypt.compare(password, user.dPassword1_hash);
                    console.log('Password comparison result:', isMatch);
                } catch (bcryptError) {
                    console.error('Error comparing passwords:', bcryptError);
                    throw new Error('Error verifying password');
                }
            }

            if (!isMatch) {
                console.log('Password mismatch, logging failed attempt');
                // Log failed attempt
                await db.query(
                    'INSERT INTO tbl_logs_useraccess (dUser_ID, dActionType, tTimeStamp) VALUES (?, ?, NOW())',
                    [userID, 'FAILED_LOGIN']
                );

                // Count failed attempts
                const [failedAttempts] = await db.query(
                    `SELECT COUNT(*) AS count 
                     FROM tbl_logs_useraccess 
                     WHERE dUser_ID = ? 
                     AND dActionType = 'FAILED_LOGIN' 
                     AND tTimeStamp > (
                         SELECT COALESCE(MAX(tTimeStamp), '1970-01-01')
                         FROM tbl_logs_useraccess
                         WHERE dUser_ID = ? AND dActionType = 'LOGIN'
                     )`,
                    [userID, userID]
                );

                const attemptsLeft = this.MAX_FAILED_ATTEMPTS - failedAttempts[0].count;
                console.log('Failed attempts:', { count: failedAttempts[0].count, attemptsLeft });
                
                if (attemptsLeft <= 0) {
                    console.log('Account locked due to too many failed attempts');
                    await db.query(`UPDATE ${table} SET dStatus = ? WHERE dUser_ID = ?`, ['LOCKED', userID]);
                    throw new Error('Account is locked due to too many failed login attempts. Please contact support.');
                }

                throw new Error(`Invalid password. You have ${attemptsLeft} attempts left.`);
            }

            console.log('Password verified successfully');
            // Log successful login
            await db.query(
                'INSERT INTO tbl_logs_useraccess (dUser_ID, dActionType, tTimeStamp) VALUES (?, ?, NOW())',
                [userID, 'LOGIN']
            );

            // Check account status
            if (user.dStatus === 'EXPIRED') {
                console.log('Account has expired');
                throw new Error('Account has expired');
            }

            //PJ IF UR READING THIS, THIS PART WAS INCLUDED FOR CHANGE PASSWORD
            // Skip OTP for password change scenario
            const shouldBypassOtp = options.bypassOtp && options.passwordChanged;
            
            // Modify the OTP check:
            if (!otp && !shouldBypassOtp) {
                console.log('Generating OTP for user:', userID);
                const generatedOtp = await this.otpService.generateOtp(user.dUser_ID);
                return { message: 'OTP sent to your registered email' };
            }
            
            // If we're bypassing OTP, skip the verification
            if (!shouldBypassOtp && otp) {
                console.log('Verifying OTP for user:', userID);
                const otpVerificationResult = await this.otpService.verifyOtp(user.dUser_ID, otp);
                console.log('OTP verification result:', otpVerificationResult);

                if (otpVerificationResult.message.includes('expired') || otpVerificationResult.message.includes('No OTP found')) {
                    return otpVerificationResult;
                }
            }
            //PJ THIS IS WHERE THE CHANGE PASSWORD MODIFICATION ENDS

            // Handle OTP
            if (otp) {
                console.log('Verifying OTP for user:', userID);
                const otpVerificationResult = await this.otpService.verifyOtp(user.dUser_ID, otp);
                console.log('OTP verification result:', otpVerificationResult);

                if (otpVerificationResult.message.includes('expired') || otpVerificationResult.message.includes('No OTP found')) {
                    return otpVerificationResult;
                }

                // Generate session token
                console.log('Generating session token');
                const sessionId = crypto.randomBytes(32).toString('hex');
                const token = jwt.sign(
                    { 
                        id: user.dUser_ID, 
                        role: user.dUser_Type,
                        sessionId: sessionId
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );
                

                // Update user session info
                console.log('Updating user session info');
                await db.query(
                    `UPDATE ${table} SET 
                    tLast_Login = NOW(),
                    dSession_ID = ?,
                    dDevice_Info = ?,
                    tLastUpdated = NOW()
                    WHERE dUser_ID = ?`,
                    [sessionId, 'Web Browser', userID]
                );

                return { 
                    message: 'Login successful', 
                    token, 
                    user: { 
                        id: user.dUser_ID,
                        name: user.dName,
                        email: user.dEmail,
                        type: user.dUser_Type,
                        status: user.dStatus
                    } 
                };
            } else {
                console.log('Generating OTP for user:', userID);
                const generatedOtp = await this.otpService.generateOtp(user.dUser_ID);
                return { message: 'OTP sent to your registered email' };
            }
        } catch (error) {
            console.error('Error in loginUser:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }

    async changePassword(userID, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE tbl_login SET dPassword1_hash = ? WHERE dUser_ID = ?', [hashedPassword, userID]);
            return { message: 'Password changed successfully' };
        } catch (error) {
            console.error('Error in changePassword:', error);
            throw new Error('Failed to change password');
        }
    }

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
            // Generate custom userID
            const date = new Date();
            const formattedDate = `${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
            
            const [rows] = await db.query('SELECT COUNT(*) AS count FROM tbl_login');
            const count = rows[0].count + 1;
            const customUserID = `${formattedDate}${count.toString().padStart(4, '0')}`;
    
            // Validate password
            if (!userData.Password || userData.Password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
    
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.Password, 10);
    
            // Normalize security answers
            const normalizedSecurityAnswers = [
                userData.Security_Answer,
                userData.Security_Answer2,
                userData.Security_Question3
            ].map(answer => answer.toLowerCase());
            
            const createdBy = userData.created_by || "SYSTEM";
            const expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + 15);

            // Insert new user
            const [result] = await db.query(
                `INSERT INTO tbl_login (
                    dUser_ID, dName, dEmail, dPassword1_hash, dUser_Type,
                    dSecurity_Question1, dSecurity_Question2, dSecurity_Question3,
                    dAnswer_1, dAnswer_2, dAnswer_3,
                    dStatus, dCreatedBy, tExpirationDate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    customUserID,
                    userData.Name,
                    userData.Email,
                    hashedPassword,
                    userData.user_type,
                    userData.Security_Question,
                    userData.Security_Question2,
                    userData.Security_Question3,
                    normalizedSecurityAnswers[0],
                    normalizedSecurityAnswers[1],
                    normalizedSecurityAnswers[2],
                    'FIRST-TIME',
                    createdBy,
                    expirationDate
                ]
            );
    
            return customUserID;
        } catch (error) {
            console.error('Error in registerUser:', error);
            throw error;
        }
    }

    async checkPasswordExpiration(userID) {
        try {
            const [rows] = await db.query(
                'SELECT tExpirationDate, dStatus FROM tbl_login WHERE dUser_ID = ?', 
                [userID]
            );
            
            if (rows.length === 0) {
                throw new Error('User not found');
            }
            
            const { tExpirationDate, dStatus } = rows[0];
            
            if (!tExpirationDate) {
                return false;
            }
            
            const currentDate = new Date();
            const expDate = new Date(tExpirationDate);
            const isExpired = currentDate >= expDate;
            
            if (isExpired && dStatus !== 'EXPIRED') {
                await db.query(
                    'UPDATE tbl_login SET dStatus = ? WHERE dUser_ID = ?',
                    ['EXPIRED', userID]
                );
            }
            
            return isExpired;
        } catch (error) {
            console.error('Error checking password expiration:', error);
            throw error;
        }
    }
}

module.exports = LoginService; // Export the class, not an instance