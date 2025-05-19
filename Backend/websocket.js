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
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'USER_UPDATE' }));
    }
  });
}

module.exports = { setupWebSocket, broadcastUserUpdate }; 