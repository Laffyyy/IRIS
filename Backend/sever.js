/*const express = require('express');
const cors = require('cors');*/

const app = require('./app');
require('dotenv').config();

//const userRoutes = require('./routes/userRoutes');

/*const app = express();
app.use(cors());
app.use(express.json());*/

//app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
