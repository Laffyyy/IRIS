const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());

module.exports = app;