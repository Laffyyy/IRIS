const db = require('../db');
const bcrypt = require('bcrypt');

const createUser = (req, res) => {
  const {
    dUser_ID,
    dEmail,
    dPassword1_hash,
    dUser_Type,
    dStatus,
    dCreatedBy
  } = req.body;

  const createdAt = new Date();

  const sql = `
    INSERT INTO tbl_login
    (dUser_ID, dEmail, dPassword1_hash, dUser_Type, dStatus, dCreatedBy, dCreatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [dUser_ID, dEmail, dPassword1_hash, dUser_Type, dStatus, dCreatedBy, createdAt],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "User created successfully", userID: dUser_ID });
    }
  );
};

const getAllUsers = (req, res) => {
  const sql = 'SELECT dUser_ID, dEmail, dUser_Type, dStatus FROM tbl_login';

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'No users found' });

    res.json(results);  // Return all users as an array
  });
};

module.exports = { createUser, getAllUsers  /* other exports */ };

