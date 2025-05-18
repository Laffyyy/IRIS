const express = require('express');
const cors = require('cors');
const app = express();
const loginRoutes = require('./routes/loginroutes');
const otpRoutes = require('./routes/otproutes');
const processingMonthRoutes = require('./routes/processingMonthRoutes');
const helmet = require('helmet');

app.use(express.json());
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3001', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/processing-month', processingMonthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;