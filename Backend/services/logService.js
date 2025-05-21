// Backend/services/logService.js
const db = require('../config/db'); // adjust path to your DB connection

exports.logAdminAction = async ({ dActionLocation_ID, dActionLocation, dActionType, dActionBy }) => {
  const sql = `
    INSERT INTO tbl_logs_admin 
      (dActionLocation_ID, dActionLocation, dActionType, dActionBy, tActionAt)
    VALUES (?, ?, ?, ?, NOW())
  `;
  await db.query(sql, [dActionLocation_ID, dActionLocation, dActionType, dActionBy]);
};