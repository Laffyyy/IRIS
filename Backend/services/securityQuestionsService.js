const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getSecurityQuestions = async (email) => {
  // First check tbl_login
  let [userRows] = await db.query(
    `SELECT dSecurity_Question1, dSecurity_Question2, dSecurity_Question3 
     FROM tbl_login WHERE dEmail = ?`,
    [email]
  );

  // If not found in tbl_login, check tbl_admin
  if (userRows.length === 0) {
    [userRows] = await db.query(
      `SELECT dSecurity_Question1, dSecurity_Question2, dSecurity_Question3 
       FROM tbl_admin WHERE dEmail = ?`,
      [email]
    );
  }

  if (userRows.length === 0) {
    throw new Error('User not found');
  }

  const { dSecurity_Question1, dSecurity_Question2, dSecurity_Question3 } = userRows[0];
  const questionIds = [dSecurity_Question1, dSecurity_Question2, dSecurity_Question3];

  const [questionRows] = await db.query(
    `SELECT dSecurityQuestion_ID AS id, dSecurityQuestion AS question 
     FROM tbl_securityquestions WHERE dSecurityQuestion_ID IN (?, ?, ?)`,
    questionIds
  );

  return questionRows;
};

exports.verifyAnswers = async (email, answers) => {
  // First check tbl_login
  let [userRows] = await db.query(
    `SELECT dSecurity_Question1, dAnswer_1,
            dSecurity_Question2, dAnswer_2,
            dSecurity_Question3, dAnswer_3
     FROM tbl_login WHERE dEmail = ?`,
    [email]
  );

  // If not found in tbl_login, check tbl_admin
  if (userRows.length === 0) {
    [userRows] = await db.query(
      `SELECT dSecurity_Question1, dAnswer_1,
              dSecurity_Question2, dAnswer_2,
              dSecurity_Question3, dAnswer_3
       FROM tbl_admin WHERE dEmail = ?`,
      [email]
    );
  }

  if (userRows.length === 0) {
    throw new Error('User not found');
  }

  const user = userRows[0];

  // Map question IDs to their corresponding hashed answers
  const answerMap = {
    [user.dSecurity_Question1]: user.dAnswer_1,
    [user.dSecurity_Question2]: user.dAnswer_2,
    [user.dSecurity_Question3]: user.dAnswer_3
  };

  // Only verify the answers submitted from frontend (select + input)
  for (const [questionId, submittedAnswer] of Object.entries(answers)) {
    const hashedAnswer = answerMap[questionId];

    if (!hashedAnswer) {
      throw new Error(`Security question ID ${questionId} is invalid for this user`);
    }

    if (!submittedAnswer || submittedAnswer.trim() === '') {
      throw new Error('Answer cannot be empty');
    }

    const isMatch = await bcrypt.compare(submittedAnswer.trim(), hashedAnswer);
    if (!isMatch) {
      return false; // Mismatch
    }
  }

  return true; // All selected question-answer pairs matched
};