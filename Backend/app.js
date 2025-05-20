const express = require('express');
const loginRoutes = require('./routes/loginroutes');
const securityRoutes = require('./routes/securityroutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const helment = require('helmet');
const cors = require('cors');
const otpRoutes = require('./routes/otproutes'); // Import the OTP routes

const app = express();

app.use(express.json());
app.use(helment());
app.use(cors({
    origin: 'http://localhost:3001', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));

app.use('/api/login', loginRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/password', forgotPasswordRoutes);
app.use('/api/otp', otpRoutes); // Add this line to include the OTP routes

module.exports = app;