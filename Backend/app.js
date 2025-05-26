const express = require('express');
const helment = require('helmet');
const cors = require('cors');
const passwordExpirationRoutes = require('./routes/passwordExpirationRoutes');
const loginRoutes = require('./routes/loginroutes');
const changepassRoutes = require('./routes/changepasswordroutes');
const SiteManagementRoutes = require('./routes/siteManagementRoutes');
const otpRoutes = require('./routes/otproutes'); // Import the OTP routes
const changepassRoutes = require('./routes/changepasswordroutes');
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
app.use('/api/otp', otpRoutes)
app.use('/api/changepass', changepassRoutes);
app.use('/api/sites', SiteManagementRoutes);
app.use('/api/dev', devRoutes); // Add this line to include the Dev routes

module.exports = app;