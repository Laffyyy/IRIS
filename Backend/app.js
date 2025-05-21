const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const userRoutes = require('./routes/userRoutes');
const loginRoutes = require('./routes/loginroutes');
const otpRoutes = require('./routes/otproutes');
require('./binlogListener');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
}));

// Mount routes
app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
