const express = require('express');
const loginRoutes = require('./routes/loginroutes');
const securityRoutes = require('./routes/securityRoutes');
const helment = require('helmet');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(helment());
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow specific headers
}));

app.use('/api/login', loginRoutes);
app.use('/api/security', securityRoutes);

module.exports = app;