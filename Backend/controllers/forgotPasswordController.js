const forgotPasswordService = require('../services/forgotPasswordService');

const forgotPasswordController = {
    async resetPassword(req, res) {
        try {
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({ success: false, error: 'Email and new password are required' });
            }

            const result = await forgotPasswordService.resetPasswordByEmail(email, newPassword);

            return res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            console.error('[RESET PASSWORD ERROR]', error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = forgotPasswordController;
