const db = require('../config/db');
const bcrypt = require('bcrypt');

const forgotPasswordService = {
    async resetPasswordByEmail(email, newPassword) {
        try {
            // Find user by email and get password hashes
            const [userRows] = await db.query(
                'SELECT dUser_ID, dPassword1_hash, dPassword2_hash, dPassword3_hash FROM iris.tbl_login WHERE dEmail = ?', 
                [email]
            );

            if (userRows.length === 0) {
                throw new Error('User not found');
            }

            const user = userRows[0];

            // Check if new password matches any of the last 3
            const previousPasswords = [
                user.dPassword1_hash,
                user.dPassword2_hash,
                user.dPassword3_hash
            ].filter(Boolean); // remove nulls if any

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
                UPDATE tbl_login 
                SET dPassword3_hash = dPassword2_hash,
                    dPassword2_hash = dPassword1_hash,
                    dPassword1_hash = ?,
                    tLastUpdated = NOW()
                WHERE dUser_ID = ?`, 
                [hashedPassword, user.dUser_ID]
            );

            return { message: 'Password reset successfully' };

        } catch (error) {
            throw error;
        }
    }
};

module.exports = forgotPasswordService;
