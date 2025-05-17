const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../models/login');
const OtpService = require('./otpService'); // Import the OtpService


class LoginService {
    constructor() {
        this.otpService = new OtpService(); // Initialize OtpService
    }

    
    async loginUser(userID, password, otp = null) {
    try {
        let user = null;
        let table = null;

        // Step 1: Check if the user exists in tbl_login
        const [loginRows] = await db.query('SELECT * FROM tbl_login WHERE dUser_ID = ?', [userID]);
        if (loginRows.length > 0) {
            user = loginRows[0];
            table = 'tbl_login';
        } else {
            const [adminRows] = await db.query('SELECT * FROM tbl_admin WHERE dUser_ID = ?', [userID]);
            if (adminRows.length > 0) {
                user = adminRows[0];
                table = 'tbl_admin';
            }
        }

        // If user is not found in either table
        if (!user) {
            throw new Error('User not found');
        }

         // Check if the account is locked in the database
         if (user.dStatus === 'LOCKED') {
            throw new Error('Account is locked. Please contact support.');
        }


        // Step 3: Verify the password
        let isMatch = false;
        if (table === 'tbl_login') {
            if (!user.dPassword1_hash) {
                throw new Error('Password hash is missing for tbl_login');
            }
            isMatch = await bcrypt.compare(password, user.dPassword1_hash);
        } else if (table === 'tbl_admin') {
            if (!user.dPassword1_hash) {
                throw new Error('Password hash is missing for tbl_admin');
            }
            isMatch = await bcrypt.compare(password, user.dPassword1_hash);
        }

        if (!isMatch) {
            // Log the failed login attempt
            await db.query(
                'INSERT INTO tbl_logs_useraccess (userID, dLoginResult) VALUES (?, ?)',
                [userID, 'FAILED']
            );

            // Count the number of failed attempts in the last 15 minutes
            const [failedAttempts] = await db.query(
                `SELECT COUNT(*) AS count 
                 FROM tbl_logs_useraccess 
                 WHERE userID = ? AND dLoginResult = 'FAILED' AND timestamp > NOW() - INTERVAL 15 MINUTE`,
                [userID]
            );

            if (failedAttempts[0].count >= 3) {
                // Lock the account
                await db.query('UPDATE tbl_login SET dStatus = ? WHERE dUser_ID = ?', ['LOCKED', userID]);
                throw new Error('Account is locked due to too many failed login attempts');
            }

            throw new Error(`Invalid password. You have ${3 - failedAttempts[0].count} attempts left.`);
        }

        // Log the successful login attempt
        await db.query(
            'INSERT INTO tbl_logs_useraccess (userID, dLoginResult) VALUES (?, ?)',
            [userID, 'SUCCESS']
        );

        // Step 4: Check the user's status (if applicable)
        if (user.dStatus && user.dStatus === 'DEACTIVATED') {
            throw new Error('Account is deactivated');
        }
        if (user.dStatus && user.dStatus === 'EXPIRED') {
            throw new Error('Account has expired');
        }

        // Step 5: Handle OTP verification
        if (otp) {
            // Verify the OTP using the OtpService
            const otpService = new OtpService();
            const otpVerificationResult = await otpService.verifyOtp(user.dUser_ID, otp);

            if (otpVerificationResult.message === 'OTP expired. A new OTP has been sent to your registered email or phone.') {
                return otpVerificationResult;
            }

            // Step 6: Generate a token after OTP verification
            const token = jwt.sign(
                { id: user.dUser_ID, role: user.dUser_Type || user.dStatus },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Update the last login time
            await db.query(`UPDATE ${table} SET tLast_Login = NOW() WHERE dUser_ID = ?`, [userID]);

            return { message: 'Login successful', token, user: { id: user.dUser_ID, email: user.dEmail, status: user.dStatus || user.dUser_Type } };
        } else {
            // Step 7: Generate a new OTP if none is provided
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