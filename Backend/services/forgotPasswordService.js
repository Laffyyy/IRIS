const db = require('../config/db');
const bcrypt = require('bcrypt');

const forgotPasswordService = {
    async resetPasswordByEmail(email, newPassword) {
        try {
            // First check tbl_login
            let [userRows] = await db.query(
                'SELECT dUser_ID, dPassword1_hash, dPassword2_hash, dPassword3_hash FROM tbl_login WHERE dEmail = ?', 
                [email]
            );

            let table = 'tbl_login';

            // If not found in tbl_login, check tbl_admin
            if (userRows.length === 0) {
                [userRows] = await db.query(
                    'SELECT dUser_ID, dPassword1_hash, dPassword2_hash, dPassword3_hash FROM tbl_admin WHERE dEmail = ?', 
                    [email]
                );
                if (userRows.length > 0) {
                    table = 'tbl_admin';
                }
            }

            if (userRows.length === 0) {
                throw new Error('User not found');
            }

            const user = userRows[0];

            // Check if new password matches any of the last 3
            const previousPasswords = [
                user.dPassword1_hash,
                user.dPassword2_hash,
                user.dPassword3_hash
            ].filter(Boolean);

            for (const oldHash of previousPasswords) {
                const isMatch = await bcrypt.compare(newPassword, oldHash);
                if (isMatch) {
                    throw new Error('New password cannot be the same as any of your last 3 passwords');
                }
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password history and last updated timestamp
            await db.query(`
                UPDATE ${table} 
                SET dPassword3_hash = dPassword2_hash,
                    dPassword2_hash = dPassword1_hash,
                    dPassword1_hash = ?,
                    tLastUpdated = NOW()
                WHERE dUser_ID = ?`, 
                [hashedPassword, user.dUser_ID]
            );

            // Log the password change (insert or update if already exists for this user)
            await db.query(
                `INSERT INTO tbl_logs_passwordchange (dUser_ID, dModifiedBy, tTimeStamp, dChangeReason)
                 VALUES (?, ?, NOW(), ?)
                 ON DUPLICATE KEY UPDATE 
                    tTimeStamp = NOW(),
                    dChangeReason = VALUES(dChangeReason)`,
                [user.dUser_ID, user.dUser_ID, 'FORGOT']
            );

            return { message: 'Password reset successfully' };

        } catch (error) {
            throw error;
        }
    }
};

module.exports = forgotPasswordService;
