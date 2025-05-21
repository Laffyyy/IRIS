const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
require('./binlogListener');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/users', userRoutes);

module.exports = app;
