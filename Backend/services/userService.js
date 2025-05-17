const pool = require('../db');

exports.fetchAllUsers = async () => {
  const [rows] = await pool.query("SELECT * FROM iris.tbl_login ORDER BY tCreatedAt DESC");
  return rows;
};

exports.insertUser = async ({ employeeId, name, email, hashedPassword, role, status, createdBy }) => {
  const [result] = await pool.query(
    `INSERT INTO iris.tbl_login (dUser_ID, dName, dEmail, dPassword1_hash, dUser_Type, dStatus, dCreatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employeeId, name, email, hashedPassword, role, status, createdBy]
  );
  return result.insertId;
};

exports.findExistingEmployeeIdsEmailsOrNames = async (employeeIds, emails) => {
  if (employeeIds.length === 0 && emails.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT dUser_ID, dEmail FROM iris.tbl_login WHERE dUser_ID IN (?) OR dEmail IN (?)`,
    [employeeIds, emails]
  );
  return rows;
};

exports.insertUsersBulk = async (users) => {
  const insertPromises = users.map(user =>
    pool.query(
      `INSERT INTO iris.tbl_login (dUser_ID, dName, dEmail, dPassword1_hash, dUser_Type, dStatus, dCreatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.employeeId, user.name, user.email, user.hashedPassword, user.role, user.status, user.createdBy]
    )
  );

  const results = await Promise.all(insertPromises);
  return results.map(result => result[0].insertId);
};

exports.deleteUsers = async (userIds) => {
  const placeholders = userIds.map(() => '?').join(', ');
  const [result] = await pool.query(
    `DELETE FROM iris.tbl_login WHERE dUser_ID IN (${placeholders})`,
    userIds
  );
  return result;
};

exports.updateUser = async ({ userId, employeeId, name, email, role, status, hashedPassword, securityQuestions }) => {
  let query = `UPDATE iris.tbl_login SET dUser_ID=?, dName=?, dEmail=?, dUser_Type=?, dStatus=?`;
  const params = [employeeId, name, email, role, status];
  if (hashedPassword) {
    query += ', dPassword1_hash=?';
    params.push(hashedPassword);
  }
  query += ' WHERE dLogin_ID=?';
  params.push(userId);
  const [result] = await pool.query(query, params);
  return result; // So controller can check affectedRows
};

exports.getUserByLoginId = async (loginId) => {
  const [rows] = await pool.query('SELECT * FROM iris.tbl_login WHERE dLogin_ID=?', [loginId]);
  return rows[0] || null;
};

exports.updateUserDynamic = async (userId, updateData) => {
  const fields = [];
  const params = [];
  if (updateData.employeeId !== undefined) {
    fields.push('dUser_ID=?');
    params.push(updateData.employeeId);
  }
  if (updateData.name !== undefined) {
    fields.push('dName=?');
    params.push(updateData.name);
  }
  if (updateData.email !== undefined) {
    fields.push('dEmail=?');
    params.push(updateData.email);
  }
  if (updateData.role !== undefined) {
    fields.push('dUser_Type=?');
    params.push(updateData.role);
  }
  if (updateData.status !== undefined) {
    fields.push('dStatus=?');
    params.push(updateData.status);
  }
  if (updateData.hashedPassword !== undefined) {
    fields.push('dPassword1_hash=?');
    params.push(updateData.hashedPassword);
  }
  // Add securityQuestions if you have a column for it
  if (updateData.securityQuestions !== undefined) {
    fields.push('securityQuestions=?');
    params.push(JSON.stringify(updateData.securityQuestions));
  }
  if (fields.length === 0) return { affectedRows: 0 };
  const query = `UPDATE iris.tbl_login SET ${fields.join(', ')} WHERE dLogin_ID=?`;
  params.push(userId);
  const [result] = await pool.query(query, params);
  return result;
};

exports.updateUserSecurityQuestions = async (loginId, questions) => {
  // questions: [{question, answer}, ...]
  const q1 = questions[0]?.question || '';
  const q2 = questions[1]?.question || '';
  const q3 = questions[2]?.question || '';
  const a1 = questions[0]?.answer || '';
  const a2 = questions[1]?.answer || '';
  const a3 = questions[2]?.answer || '';
  const [result] = await pool.query(
    'UPDATE iris.tbl_login SET dSecurity_Question1=?, dSecurity_Question2=?, dSecurity_Question3=?, dAnswer_1=?, dAnswer_2=?, dAnswer_3=? WHERE dLogin_ID=?',
    [q1, q2, q3, a1, a2, a3, loginId]
  );
  return result;
};
