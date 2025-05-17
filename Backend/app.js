const express = require('express');
const cors = require('cors');
const loginRoutes = require('./routes/loginroutes');
const otpRoutes = require('./routes/otpcontoller');
const changepassRoutes = require('./routes/changepasswordroutes');
const SiteManagementRoutes = require('./routes/siteManagementRoutes');
const kpiRoutes = require('./routes/kpiManagementRoutes')

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


app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes)
app.use('/api/changepass', changepassRoutes);
app.use('/api/sites', SiteManagementRoutes);
app.use('/api/kpis', kpiRoutes);

module.exports = app;