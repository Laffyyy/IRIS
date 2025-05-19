const app = require('./app'); // Import the configured app
const http = require('http');
const { setupWebSocket } = require('./websocket');
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
