const express = require('express');
const cors = require('cors');
const passwordExpirationRoutes = require('./routes/passwordExpirationRoutes');
const loginRoutes = require('./routes/loginroutes');
const helmet = require('helmet');
const otpRoutes = require('./routes/otproutes'); // Import the OTP routes
const changepassRoutes = require('./routes/changepasswordroutes');
const devRoutes = require('./routes/devroutes'); // Import the Dev routes
const fpOtpRoutes = require('./routes/fpOtpRoutes');
const securityQuestionsRoutes = require('./routes/securityQuestionsRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
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
app.use('/api/dev', devRoutes); // Add this line to include the Dev routes
app.use('/api/fp', fpOtpRoutes);
app.use('/api/security-questions', securityQuestionsRoutes);
app.use('/api/update-password', forgotPasswordRoutes);
module.exports = app;