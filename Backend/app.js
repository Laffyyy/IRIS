const express = require('express');
const helment = require('helmet');
const cors = require('cors');
const passwordExpirationRoutes = require('./routes/passwordExpirationRoutes');
const loginRoutes = require('./routes/loginroutes');
const changepassRoutes = require('./routes/changepasswordroutes');
const SiteManagementRoutes = require('./routes/siteManagementRoutes');
const otpRoutes = require('./routes/otproutes'); // Import the OTP routes
const clientManagementRoutes = require('./routes/clientManagementRoutes');
const logsRoutes = require('./routes/logsRoutes');
const devRoutes = require('./routes/devroutes'); // Import the Dev routes
const kpiRoutes = require('./routes/kpiManagementRoutes');
const processingMonthRoutes = require('./routes/processingMonthRoutes');
const userRoutes = require('./routes/userRoutes');
const fpOtpRoutes = require('./routes/fpOtpRoutes');
const securityQuestionsRoutes = require('./routes/securityQuestionsRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');

const app = express();

// Middleware
app.use(cors());
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
app.use('/api/kpis', kpiRoutes);
app.use('/api/clients', clientManagementRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/dev', devRoutes);
// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/fp', fpOtpRoutes);
app.use('/api/security-questions', securityQuestionsRoutes);
app.use('/api/update-password', forgotPasswordRoutes);
app.use('/api/processing-month', processingMonthRoutes);

module.exports = app;
