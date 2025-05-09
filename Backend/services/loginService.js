const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../models/login');

class LoginService {
    async loginUser(email, password) {
        try {
            const [rows] = await db.query('SELECT * FROM tbl_login WHERE Email = ?', [email]);
            if (rows.length === 0) {
                throw new Error('User not found');
            }
            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.Password);
            if (!isMatch) {
                throw new Error('Invalid password');
            }
            const token = jwt.sign({ id: user.userID }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return { token, user };
        } catch (error) {
            throw error;
        }
    }

    async registerUser(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.Password, 10);
            const newUser = new login(
                null,
                userData.Email,
                hashedPassword,
                userData.user_type,
                userData.Security_Question,
                userData.Security_Question2,
                userData.Security_Question3,
                userData.Security_Answer,
                userData.Security_Answer2,
                userData.Security_Answer3,
                null,
                'FIRST-TIME', // Default status
                null,
                userData.created_by,
                null
            );
            const [result] = await db.query(
            'INSERT INTO tbl_login (dEmail, dPassword_hash, dUser_Type, dSecurity_Question1, dSecurity_Question2, dSecurity_Question3, dAnswer_1, dAnswer_2, dAnswer_3, dStatus, dCreatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
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