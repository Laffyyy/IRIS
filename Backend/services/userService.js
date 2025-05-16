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
