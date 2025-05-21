const express = require('express');
const cors = require('cors');
const app = require('./app');
require('dotenv').config();

app.use(cors());


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Server error:', error);
});
