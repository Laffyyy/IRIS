const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../models/login');
const OtpService = require('./otpService'); // Import the OtpService

class LoginService {
    constructor() {
        this.otpService = new OtpService(); // Initialize OtpService
    }
    async loginUser(userID, password,otp = null) {
        try {
            const [rows] = await db.query('SELECT * FROM tbl_login WHERE dUser_ID = ?', [userID]);
            if (rows.length === 0) {
                throw new Error('User not found');
            }
            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.dPassword_hash);
            if (!isMatch) {
                throw new Error('Invalid password');
            }

            // If OTP is provided, verify it
            if (otp) {
                await this.otpService.verifyOtp(user.dUser_ID, otp);
            } else {
                // Generate and send OTP if not provided
                const generatedOtp = await this.otpService.generateOtp(user.dUser_ID);
                // Here, you would send the OTP to the user via email/SMS
                console.log(`Generated OTP for user ${user.dUser_ID}: ${generatedOtp}`);
                return { message: 'OTP sent to your registered email or phone' };
            }

            // Include the user's role in the token payload
            const token = jwt.sign(
                { id: user.dUser_ID, role: user.dUser_Type },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            await db.query('UPDATE tbl_login SET dLast_Login = NOW() WHERE dUser_ID = ?', [userID]);

            return { token, user: { id: user.dUser_ID, email: user.dEmail, user_type: user.dUser_Type } };

        } catch (error) {
            throw error;
        }
    }

    async changePassword(userID, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE tbl_login SET dPassword_hash = ? WHERE dUser_ID = ?', [hashedPassword, userID]);
            return { message: 'Password changed successfully' };
        } catch (error) {
            throw error;
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