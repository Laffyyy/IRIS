const express = require('express');
const cors = require('cors');
const loginRoutes = require('./routes/loginroutes');
const otpRoutes = require('./routes/otpcontoller');
const helmet = require('helmet'); // Fix typo in variable name



const app = express();


// Use CORS middleware first (choose ONE configuration)
app.use(cors({
    origin: 'http://localhost:3001', // Or use '*' if you want to allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
}));

// Then parse JSON bodies
app.use(express.json());

// Then apply helmet (security headers)
app.use(helmet());

// Finally, set up your routes
app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes);

module.exports = app;