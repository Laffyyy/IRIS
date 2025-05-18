const db = require('../config/db'); // adjust path as needed
const bcrypt = require('bcrypt');

class DevServices {
    constructor() {
       
    }

    async createAdminUser({
        dUser_ID,
        dEmail,
        password,
        dSecurity_Question1,
        dSecurity_Question2,
        dSecurity_Question3,
        dAnswer_1,
        dAnswer_2,
        dAnswer_3,
        dCreatedBy
    }) {
        try {
            // Hash the password for all three password fields
            const hash = await bcrypt.hash(password, 10);

            const [result] = await db.query(
                `INSERT INTO tbl_admin (
                    dUser_ID, dEmail, dPassword1_hash, dPassword2_hash, dPassword3_hash,
                    dSecurity_Question1, dSecurity_Question2, dSecurity_Question3,
                    dAnswer_1, dAnswer_2, dAnswer_3, dStatus, dCreatedBy
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FIRST-TIME', ?)`,
                [
                    dUser_ID,
                    dEmail,
                    hash,
                    hash,
                    hash,
                    dSecurity_Question1,
                    dSecurity_Question2,
                    dSecurity_Question3,
                    dAnswer_1,
                    dAnswer_2,
                    dAnswer_3,
                    dCreatedBy
                ]
            );

            return { success: true, insertId: result.insertId };
        } catch (error) {
            console.error('Error creating admin user:', error);
            throw error;
        }
    }
}

module.exports = DevServices;


