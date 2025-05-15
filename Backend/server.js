const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Enable CORS for all routes
app.use(cors());

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM iris.tbl_login");
    res.json(rows); // ✅ make sure you're sending actual data
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});