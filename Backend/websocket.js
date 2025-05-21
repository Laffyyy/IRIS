const WebSocket = require('ws');
let wss, clients = [];

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    clients.push(ws);
    ws.on('close', () => {
      clients = clients.filter(client => client !== ws);
    });
  });
}

function broadcastUserUpdate() {
  console.log('Broadcasting USER_UPDATE to all clients');
  clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'USER_UPDATE' }));
    }
  });
}

module.exports = { setupWebSocket, broadcastUserUpdate }; 