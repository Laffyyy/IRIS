const express = require('express');
const loginRoutes = require('./routes/loginroutes');
const helment = require('helmet');
const cors = require('cors');
const otpRoutes = require('./routes/otproutes'); // Import the OTP routes
const devRoutes = require('./routes/devroutes'); // Import the Dev routes
const fpOtpRoutes = require('./routes/fpOtpRoutes');
const securityQuestionsRoutes = require('./routes/securityQuestionsRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const app = express();

app.use(express.json());
app.use(helment());
app.use(cors({
    origin: 'http://localhost:3001', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));




app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes); // Add this line to include the OTP routes
app.use('/api/dev', devRoutes); // Add this line to include the Dev routes
app.use('/api/fp', fpOtpRoutes);
app.use('/api/security-questions', securityQuestionsRoutes);
app.use('/api/update-password', forgotPasswordRoutes);
module.exports = app;