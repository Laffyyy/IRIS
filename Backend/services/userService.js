const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function computeDefaultPassword(employeeId, tCreatedAt) {
  let createdAt = tCreatedAt ? new Date(tCreatedAt) : new Date();
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  const dd = String(createdAt.getDate()).padStart(2, '0');
  const yyyy = String(createdAt.getFullYear());
  const dateStr = `${mm}${dd}${yyyy}`;
  const defaultPassword = `${employeeId}${dateStr}`;
  // Debug logging
  console.log('[computeDefaultPassword] employeeId:', employeeId);
  console.log('[computeDefaultPassword] tCreatedAt:', tCreatedAt);
  console.log('[computeDefaultPassword] dateStr:', dateStr);
  console.log('[computeDefaultPassword] defaultPassword (before hash):', defaultPassword);
  return await bcrypt.hash(defaultPassword, 10);
}

exports.fetchAllUsers = async () => {
  const [rows] = await pool.query("SELECT * FROM iris.tbl_login ORDER BY tCreatedAt DESC");
  return rows;
};

exports.insertUser = async ({ employeeId, name, email, role, status, createdBy, tCreatedAt }) => {
  // Always use the default password logic
  const createdAt = tCreatedAt ? new Date(tCreatedAt) : new Date();
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  const dd = String(createdAt.getDate()).padStart(2, '0');
  const yyyy = String(createdAt.getFullYear());
  const dateStr = `${mm}${dd}${yyyy}`;
  const defaultPassword = `${employeeId}${dateStr}`;
  console.log('[insertUser] employeeId:', employeeId);
  console.log('[insertUser] tCreatedAt:', createdAt);
  console.log('[insertUser] dateStr:', dateStr);
  console.log('[insertUser] defaultPassword (before hash):', defaultPassword);
  const finalHashedPassword = await bcrypt.hash(defaultPassword, 10);
  const [result] = await pool.query(
    `INSERT INTO iris.tbl_login (dUser_ID, dName, dEmail, dPassword1_hash, dUser_Type, dStatus, dCreatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [employeeId, name, email, finalHashedPassword, role, status, createdBy]
  );
  return result.insertId;
};

exports.findExistingEmployeeIdsEmailsOrNames = async (employeeIds, emails, excludeLoginId) => {
  if (employeeIds.length === 0 && emails.length === 0) return [];
  let query = `SELECT dUser_ID, dEmail FROM iris.tbl_login WHERE (dUser_ID IN (?) OR dEmail IN (?))`;
  const params = [employeeIds, emails];
  if (excludeLoginId) {
    query += ' AND dLogin_ID != ?';
    params.push(excludeLoginId);
  }
  const [rows] = await pool.query(query, params);
  return rows;
};

exports.insertUsersBulk = async (users) => {
  const insertPromises = users.map(async (user) => {
    const createdAt = user.tCreatedAt ? new Date(user.tCreatedAt) : new Date();
    const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
    const dd = String(createdAt.getDate()).padStart(2, '0');
    const yyyy = String(createdAt.getFullYear());
    const dateStr = `${mm}${dd}${yyyy}`;
    const defaultPassword = `${user.employeeId}${dateStr}`;
    console.log('[insertUsersBulk] employeeId:', user.employeeId);
    console.log('[insertUsersBulk] tCreatedAt:', createdAt);
    console.log('[insertUsersBulk] dateStr:', dateStr);
    console.log('[insertUsersBulk] defaultPassword (before hash):', defaultPassword);
    const finalHashedPassword = await bcrypt.hash(defaultPassword, 10);
    return pool.query(
      `INSERT INTO iris.tbl_login (dUser_ID, dName, dEmail, dPassword1_hash, dUser_Type, dStatus, dCreatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.employeeId, user.name, user.email, finalHashedPassword, user.role, user.status, user.createdBy]
    );
  });
  return Promise.all(insertPromises);
};

exports.insertAdminUser = async ({ employeeId, name, email, status, createdBy, tCreatedAt }) => {
  // Always use the default password logic
  const createdAt = tCreatedAt ? new Date(tCreatedAt) : new Date();
  const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
  const dd = String(createdAt.getDate()).padStart(2, '0');
  const yyyy = String(createdAt.getFullYear());
  const dateStr = `${mm}${dd}${yyyy}`;
  const defaultPassword = `${employeeId}${dateStr}`;
  console.log('[insertAdminUser] employeeId:', employeeId);
  console.log('[insertAdminUser] tCreatedAt:', createdAt);
  console.log('[insertAdminUser] dateStr:', dateStr);
  console.log('[insertAdminUser] defaultPassword (before hash):', defaultPassword);
  const finalHashedPassword = await bcrypt.hash(defaultPassword, 10);
  const [result] = await pool.query(
    `INSERT INTO iris.tbl_admin (dUser_ID, dName, dEmail, dPassword1_hash, dStatus, dCreatedBy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employeeId, name, email, finalHashedPassword, status, createdBy]
  );
  return result.insertId;
};

exports.insertAdminUsersBulk = async (users) => {
  const insertPromises = users.map(async (user) => {
    const createdAt = user.tCreatedAt ? new Date(user.tCreatedAt) : new Date();
    const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
    const dd = String(createdAt.getDate()).padStart(2, '0');
    const yyyy = String(createdAt.getFullYear());
    const dateStr = `${mm}${dd}${yyyy}`;
    const defaultPassword = `${user.employeeId}${dateStr}`;
    console.log('[insertAdminUsersBulk] employeeId:', user.employeeId);
    console.log('[insertAdminUsersBulk] tCreatedAt:', createdAt);
    console.log('[insertAdminUsersBulk] dateStr:', dateStr);
    console.log('[insertAdminUsersBulk] defaultPassword (before hash):', defaultPassword);
    const finalHashedPassword = await bcrypt.hash(defaultPassword, 10);
    return pool.query(
      `INSERT INTO iris.tbl_admin (dUser_ID, dName, dEmail, dPassword1_hash, dStatus, dCreatedBy)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.employeeId, user.name, user.email, finalHashedPassword, user.status, user.createdBy]
  );
  });
  return Promise.all(insertPromises);
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
  const [rows] = await pool.query('SELECT * FROM iris.tbl_login WHERE dLoginEntry_ID=?', [loginId]);
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

  if (updateData.expirationDate === true) {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 15);
    fields.push('tExpirationDate=?');
    params.push(expirationDate);
  }

  if (fields.length === 0) return { affectedRows: 0 };
  const query = `UPDATE iris.tbl_login SET ${fields.join(', ')} WHERE dLoginEntry_ID=?`;
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
    'UPDATE iris.tbl_login SET dSecurity_Question1=?, dSecurity_Question2=?, dSecurity_Question3=?, dAnswer_1=?, dAnswer_2=?, dAnswer_3=? WHERE dLoginEntry_ID=?',
    [q1, q2, q3, a1, a2, a3, loginId]
  );
  return result;
};

exports.findExistingAdminEmployeeIdsEmails = async (employeeIds, emails, excludeLoginId) => {
  if ((!employeeIds || employeeIds.length === 0) && (!emails || emails.length === 0)) return [];
  let query = `SELECT dUser_ID, dEmail FROM iris.tbl_admin WHERE (dUser_ID IN (?) OR dEmail IN (?))`;
  const params = [employeeIds.length ? employeeIds : [''], emails.length ? emails : ['']];
  if (excludeLoginId) {
    query += ' AND dAdmin_ID != ?';
    params.push(excludeLoginId);
  }
  const [rows] = await pool.query(query, params);
  return rows;
};

exports.fetchAllAdmins = async () => {
  const [rows] = await pool.query("SELECT * FROM iris.tbl_admin ORDER BY tCreatedAt DESC");
  return rows;
};

exports.deactivateUsers = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  const placeholders = userIds.map(() => '?').join(', ');
  await pool.query(
    `UPDATE iris.tbl_login SET dStatus='DEACTIVATED' WHERE dUser_ID IN (${placeholders})`,
    userIds
  );
};

exports.restoreUsers = async (userIds) => {
  const restoredPasswords = [];
  for (const userId of userIds) {
    // Try tbl_login first
    let [userRows] = await pool.query('SELECT * FROM iris.tbl_login WHERE dUser_ID = ?', [userId]);
    let table = 'iris.tbl_login';
    if (userRows.length === 0) {
      // If not found, try tbl_admin
      [userRows] = await pool.query('SELECT * FROM iris.tbl_admin WHERE dUser_ID = ?', [userId]);
      table = 'iris.tbl_admin';
    }
    const user = userRows[0];
    if (!user) continue; // skip if user not found

    // Use the correct employeeId from the user row
    const employeeId = user.dUser_ID;
    let tCreatedAtRaw = user.tCreatedAt ? user.tCreatedAt : null;
    let tCreatedAt = tCreatedAtRaw ? new Date(tCreatedAtRaw) : new Date();
    // Always use UTC for MMDDYYYY
    const mm = String(tCreatedAt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(tCreatedAt.getUTCDate()).padStart(2, '0');
    const yyyy = String(tCreatedAt.getUTCFullYear());
    const dateStr = `${mm}${dd}${yyyy}`;
    const defaultPassword = `${employeeId}${dateStr}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 5);

    // Debug log
    console.log(`[restoreUsers] Table: ${table}, employeeId: ${employeeId}, tCreatedAtRaw: ${tCreatedAtRaw}, dateStr: ${dateStr}, defaultPassword: ${defaultPassword}`);

    // Update the correct table
  await pool.query(
      `UPDATE ${table} SET dStatus=?, tExpirationDate=?, dPassword1_hash=? WHERE dUser_ID=?`,
      ['FIRST-TIME', expirationDate, hashedPassword, employeeId]
  );
    restoredPasswords.push({ userId: employeeId, defaultPassword, table });
  }
  return restoredPasswords;
};

exports.getAdminByLoginId = async (loginId) => {
  const [rows] = await pool.query('SELECT * FROM iris.tbl_admin WHERE dAdminEntry_ID=?', [loginId]);
  return rows[0] || null;
};

exports.updateAdminUserDynamic = async (userId, updateData) => {
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
  if (updateData.status !== undefined) {
    fields.push('dStatus=?');
    params.push(updateData.status);
  }
  if (updateData.hashedPassword !== undefined) {
    fields.push('dPassword1_hash=?');
    params.push(updateData.hashedPassword);
  }
  if (fields.length === 0) return { affectedRows: 0 };
  const query = `UPDATE iris.tbl_admin SET ${fields.join(', ')} WHERE dAdminEntry_ID=?`;
  params.push(userId);
  const [result] = await pool.query(query, params);
  return result;
};
