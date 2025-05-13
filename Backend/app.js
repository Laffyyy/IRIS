const express = require('express');
const cors = require('cors');
const loginRoutes = require('./routes/loginroutes');
const otpRoutes = require('./routes/otpcontoller');
const helment = require('helmet');
const cors = require('cors');

const app = express();

// Use cors middleware before routes
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true  // Add this line to allow credentials
}));

// Parse JSON bodies
app.use(express.json());
app.use(helment());
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));




app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes)

module.exports = app;