const express = require('express');
const cors = require('cors');
const app = require('./app');
require('dotenv').config();

app.use(cors());


const PORT = process.env.PORT || 3000;


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
