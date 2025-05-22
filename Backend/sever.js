const express = require('express');
const cors = require('cors');
const app = require('./app');
require('dotenv').config();

app.use(cors());


const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
