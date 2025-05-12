const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../models/login');

class ChangePasswordService {

    async updateFirstTimeUser(userID, newPassword, securityQuestions) {
        try {
          // Validate inputs
          if (!userID || !newPassword || !securityQuestions) {
            throw new Error('Missing required parameters');
          }
      
          // Make sure security questions and answers exist
          const requiredFields = ['Security_Question', 'Security_Question2', 'Security_Question3', 
                                 'Security_Answer', 'Security_Answer2', 'Security_Answer3'];
          
          for (const field of requiredFields) {
            if (!securityQuestions[field]) {
              throw new Error(`Missing required field: ${field}`);
            }
          }
          
          // First get the current password hashes to check against reuse
          const [currentUser] = await db.query(
            'SELECT dPassword1_hash, dPassword2_hash, dPassword3_hash FROM tbl_login WHERE dUser_ID = ?', 
            [userID]
          );
              
          if (currentUser.length === 0) {
            throw new Error('User not found');
          }
              
          // Hash the new password
          const hashedNewPassword = await bcrypt.hash(newPassword, 10);
              
          // Check if new password matches any previous passwords
          const previousPasswords = [
            currentUser[0].dPassword1_hash,
            currentUser[0].dPassword2_hash,
            currentUser[0].dPassword3_hash
          ].filter(Boolean); // Filter out null values
              
          // Check each previous password
          for (const oldPasswordHash of previousPasswords) {
            if (oldPasswordHash) {
              // We need to check if the new plain text password matches any of the hashed ones
              const isMatch = await bcrypt.compare(newPassword, oldPasswordHash);
              if (isMatch) {
                throw new Error('New password cannot be the same as any of your last 3 passwords');
              }
            }
          }
              
          // Normalize security answers - handle null/undefined values
          const normalizedSecurityAnswers = [
            securityQuestions.Security_Answer || '',
            securityQuestions.Security_Answer2 || '',
            securityQuestions.Security_Answer3 || ''
          ].map(answer => (answer || '').toLowerCase());
          
          // Continue with password update - move current password to dPassword2_hash
          await db.query(
            `UPDATE tbl_login 
             SET dPassword3_hash = dPassword2_hash,
                 dPassword2_hash = dPassword1_hash, 
                 dPassword1_hash = ?,
                 dSecurity_Question1 = ?, 
                 dSecurity_Question2 = ?, 
                 dSecurity_Question3 = ?,
                 dAnswer_1 = ?, 
                 dAnswer_2 = ?, 
                 dAnswer_3 = ?,
                 dStatus = 'ACTIVE',
                 tLast_Login = NOW(),
                 tLastUpdated = NOW()
             WHERE dUser_ID = ?`,
            [
              hashedNewPassword,
              securityQuestions.Security_Question,
              securityQuestions.Security_Question2,
              securityQuestions.Security_Question3,
              normalizedSecurityAnswers[0],
              normalizedSecurityAnswers[1],
              normalizedSecurityAnswers[2],
              userID
            ]
          );
          
          return { message: 'Profile updated successfully' };
        } catch (error) {
          console.error('Error in updateFirstTimeUser:', error);
          throw error;
        }
      }
    
    async changePassword(userID, newPassword) {
        try {
            // Get existing password hashes
            const [currentUser] = await db.query(
                'SELECT dPassword1_hash, dPassword2_hash, dPassword3_hash FROM tbl_login WHERE dUser_ID = ?', 
                [userID]
            );
            
            if (currentUser.length === 0) {
                throw new Error('User not found');
            }
            
            // Check if new password matches any previous passwords
            const previousPasswords = [
                currentUser[0].dPassword1_hash,
                currentUser[0].dPassword2_hash,
                currentUser[0].dPassword3_hash
            ].filter(Boolean);
            
            for (const oldPasswordHash of previousPasswords) {
                if (oldPasswordHash) {
                    const isMatch = await bcrypt.compare(newPassword, oldPasswordHash);
                    if (isMatch) {
                        throw new Error('New password cannot be the same as any of your last 3 passwords');
                    }
                }
            }
            
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password history
            await db.query(`
                UPDATE tbl_login 
                SET dPassword3_hash = dPassword2_hash,
                    dPassword2_hash = dPassword1_hash, 
                    dPassword1_hash = ?,
                    tLastUpdated = NOW()
                WHERE dUser_ID = ?`, 
                [hashedPassword, userID]
            );
            
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

}

module.exports = ChangePasswordService;