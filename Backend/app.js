const express = require('express');
const loginRoutes = require('./routes/loginroutes');
const otpRoutes = require('./routes/otpcontoller');

const app = express();

app.use(express.json());


app.use('/api/login', loginRoutes);
app.use('/api/otp', otpRoutes)



module.exports = app;