const app = require('./app'); // Import the configured app
const http = require('http');
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);


server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
