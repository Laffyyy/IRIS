const express = require('express');
const loginRoutes = require('./routes/loginroutes');

const app = express();

app.use(express.json());


app.use('/api/login', loginRoutes);



module.exports = app;