const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const login = require('../models/login');

class ChangePasswordService {
    
    // Add this new method to fetch security questions from the database
    async getUserStatus(userID) {
      try {
          // Check in tbl_login first
          const [loginRows] = await db.query(
              'SELECT dStatus FROM tbl_login WHERE dUser_ID = ?', 
              [userID]
          );
          
          if (loginRows.length > 0) {
              return loginRows[0].dStatus;
          }
          
          // If not found in tbl_login, check in tbl_admin
          const [adminRows] = await db.query(
              'SELECT dStatus FROM tbl_admin WHERE dUser_ID = ?', 
              [userID]
          );
          
          if (adminRows.length > 0) {
              return adminRows[0].dStatus;
          }
          
          throw new Error('User not found');
      } catch (error) {
          console.error('Error getting user status:', error);
          throw error;
      }
    }

    // Add this new method to verify credentials without full login
    async verifyCredentials(userID, password) {
      try {
          // Check if user exists in tbl_login or tbl_admin
          let user = null;
          
          // Check tbl_login first
          const [loginRows] = await db.query(
              'SELECT dPassword1_hash, dStatus FROM tbl_login WHERE dUser_ID = ?', 
              [userID]
          );
          
          if (loginRows.length > 0) {
              user = loginRows[0];
          } else {
              // If not found in tbl_login, check in tbl_admin
              const [adminRows] = await db.query(
                  'SELECT dPassword1_hash, dStatus FROM tbl_admin WHERE dUser_ID = ?', 
                  [userID]
              );
              
              if (adminRows.length > 0) {
                  user = adminRows[0];
              }
          }
          
          if (!user) {
              throw new Error('User not found');
          }
          
          // Verify password
          if (!user.dPassword1_hash) {
              throw new Error('Password hash is missing');
          }
          
          const isMatch = await bcrypt.compare(password, user.dPassword1_hash);
          if (!isMatch) {
              throw new Error('Invalid password');
          }
          
          return { 
              success: true, 
              status: user.dStatus 
          };
          
      } catch (error) {
          console.error('Error verifying credentials:', error);
          throw error;
      }
    }

    async getSecurityQuestions() {
        try {
            const [questions] = await db.query('SELECT * FROM tbl_securityquestions');
            return questions;
        } catch (error) {
            console.error('Error fetching security questions:', error);
            throw error;
        }
    }

    async updateFirstTimeUser(userID, newPassword, securityQuestions) {
      try {
        // Validate inputs
        if (!userID || !newPassword || !securityQuestions) {
          throw new Error('Missing required parameters');
        }
    
        // Make sure security questions and answers exist
        const requiredFields = ['questionId1', 'questionId2', 'questionId3', 
                               'answer1', 'answer2', 'answer3'];
        
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
        
        // Hash the security answers
        const hashedAnswer1 = await bcrypt.hash(securityQuestions.answer1, 10);
        const hashedAnswer2 = await bcrypt.hash(securityQuestions.answer2, 10);
        const hashedAnswer3 = await bcrypt.hash(securityQuestions.answer3, 10);
        
        // Set password expiration date to 15 minutes from now
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 15);
        
        // Update user with new password hash, security question IDs, and hashed answers
        // Using the correct column names: dSecurity_Question1, dSecurity_Question2, dSecurity_Question3
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
               tLastUpdated = NOW(),
               tExpirationDate = ?
           WHERE dUser_ID = ?`,
          [
            hashedNewPassword,
            securityQuestions.questionId1,
            securityQuestions.questionId2,
            securityQuestions.questionId3,
            hashedAnswer1,
            hashedAnswer2,
            hashedAnswer3,
            expirationDate,
            userID
          ]
        );

        await db.query(
            `INSERT INTO tbl_logs_passwordchange 
             (dUser_ID, dModifiedBy, tTimeStamp, dChangeReason)
             VALUES (?, ?, NOW(), ?)`,
            [userID, userID, 'FIRST-TIME']
          );
        
        return { message: 'Profile updated successfully' };
      } catch (error) {
        console.error('Error in updateFirstTimeUser:', error);
        throw error;
      }
    }
    
    async changePassword(userID, newPassword) {
        try {
            // First get current password hashes to check against reuse
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
            ].filter(Boolean); // Filter out null values
            
            // Check each previous password
            for (const oldPasswordHash of previousPasswords) {
                if (oldPasswordHash) {
                    const isMatch = await bcrypt.compare(newPassword, oldPasswordHash);
                    if (isMatch) {
                        throw new Error('The user cannot use the same password as any of their last 3 passwords.');
                    }
                }
            }
    
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update password and rotate history
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
            console.error('Error in changePassword:', error);
            throw error;
        }
    }

    async changeSecurityQuestions(userID, securityQuestions) {
      try {
          // Hash the security answers
          const hashedAnswer1 = await bcrypt.hash(securityQuestions.answer1, 10);
          const hashedAnswer2 = await bcrypt.hash(securityQuestions.answer2, 10);
          const hashedAnswer3 = await bcrypt.hash(securityQuestions.answer3, 10);
  
          await db.query(
              `UPDATE tbl_login 
               SET dSecurity_Question1 = ?, 
                   dSecurity_Question2 = ?, 
                   dSecurity_Question3 = ?,
                   dAnswer_1 = ?, 
                   dAnswer_2 = ?, 
                   dAnswer_3 = ?,
                   tLastUpdated = NOW()
               WHERE dUser_ID = ?`,
              [
                  securityQuestions.questionId1,
                  securityQuestions.questionId2,
                  securityQuestions.questionId3,
                  hashedAnswer1,
                  hashedAnswer2,
                  hashedAnswer3,
                  userID
              ]
          );
          return { message: 'Security questions updated successfully' };
      } catch (error) {
          throw error;
      }
  }

    // Add method for verifying security answers (for password recovery)
    async verifySecurityAnswer(userId, questionId, answer) {
      try {
          // Get hashed answer from database based on user and question ID
          const [result] = await db.query(
              `SELECT 
                  CASE 
                      WHEN dSecurity_Question1 = ? THEN dAnswer_1
                      WHEN dSecurity_Question2 = ? THEN dAnswer_2
                      WHEN dSecurity_Question3 = ? THEN dAnswer_3
                      ELSE NULL
                  END AS hashedAnswer
              FROM tbl_login
              WHERE dUser_ID = ?`,
              [questionId, questionId, questionId, userId]
          );
  
          if (result.length === 0 || !result[0].hashedAnswer) {
              return false;
          }
  
          // Compare provided answer with stored hash
          return await bcrypt.compare(answer, result[0].hashedAnswer);
      } catch (error) {
          console.error('Error verifying security answer:', error);
          throw error;
      }
  }

  async generateAuthToken(userID) {
    try {
        // Get user information including role
        const [userRows] = await db.query(
            'SELECT dUser_ID, dUser_Type FROM tbl_login WHERE dUser_ID = ?',
            [userID]
        );
        
        if (userRows.length === 0) {
            // If not in tbl_login, check tbl_admin
            const [adminRows] = await db.query(
                'SELECT dUser_ID, "admin" AS dUser_Type FROM tbl_admin WHERE dUser_ID = ?',
                [userID]
            );
            
            if (adminRows.length === 0) {
                throw new Error('User not found');
            }
            
            // Generate token for admin user
            const sessionId = require('crypto').randomBytes(32).toString('hex');
            const token = jwt.sign(
                { 
                    id: adminRows[0].dUser_ID, 
                    role: adminRows[0].dUser_Type,
                    sessionId: sessionId
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            return {
                token,
                user: {
                    id: adminRows[0].dUser_ID,
                    type: adminRows[0].dUser_Type
                }
            };
        }
        
        // Generate token for regular user
        const sessionId = require('crypto').randomBytes(32).toString('hex');
        const token = jwt.sign(
            { 
                id: userRows[0].dUser_ID, 
                role: userRows[0].dUser_Type,
                sessionId: sessionId
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        return {
            token,
            user: {
                id: userRows[0].dUser_ID,
                type: userRows[0].dUser_Type
            }
        };
    } catch (error) {
        console.error('Error generating auth token:', error);
        throw error;
    }
}



}

module.exports = ChangePasswordService;