const app = require('./app'); // Import the configured app
const http = require('http');
const socketIo = require('socket.io');
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Make io accessible in controllers via app
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
