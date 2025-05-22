const express = require('express');
const cors = require('cors');
const passwordExpirationRoutes = require('./routes/passwordExpirationRoutes');
const loginRoutes = require('./routes/loginroutes');
const helmet = require('helmet');
const otpRoutes = require('./routes/otproutes'); // Import the OTP routes
const devRoutes = require('./routes/devroutes'); // Import the Dev routes

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use cors middleware before routes
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true  // Add this line to allow credentials
}));

app.use('/api/login', loginRoutes);
app.use('/api/password-expiration', passwordExpirationRoutes);
app.use('/api/otp', otpRoutes); // Add this line to include the OTP routes
app.use('/api/dev', devRoutes); // Add this line to include the Dev routes

module.exports = app;