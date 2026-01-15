const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3333;

// Create HTTP server for static files
const server = http.createServer((req, res) => {
  // CORS headers for extension access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(content);
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Track connected clients
const clients = {
  extension: null,  // The MetaMask extension
  viewers: new Set(), // UI viewers
};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const clientType = url.searchParams.get('type') || 'viewer';

  console.log(`[${new Date().toISOString()}] New ${clientType} connected`);

  if (clientType === 'extension') {
    clients.extension = ws;
    // Notify viewers that extension connected
    broadcastToViewers({ type: 'connection', status: 'connected' });
  } else {
    clients.viewers.add(ws);
    // If extension is already connected, notify this viewer
    if (clients.extension && clients.extension.readyState === 1) {
      ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
    }
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (clientType === 'extension') {
        // Forward state updates from extension to all viewers
        console.log(`[${new Date().toISOString()}] State update received: ${message.type}`);
        broadcastToViewers(message);
      } else if (clientType === 'viewer') {
        // Forward requests from viewers to extension
        if (message.type === 'requestRefresh' || message.type === 'requestFullState') {
          console.log(`[${new Date().toISOString()}] ${message.type} requested by viewer`);
          sendToExtension(message);
        }
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] ${clientType} disconnected`);

    if (clientType === 'extension') {
      clients.extension = null;
      broadcastToViewers({ type: 'connection', status: 'disconnected' });
    } else {
      clients.viewers.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error (${clientType}):`, err.message);
  });
});

function broadcastToViewers(message) {
  const data = JSON.stringify(message);
  clients.viewers.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

function sendToExtension(message) {
  if (clients.extension && clients.extension.readyState === 1) {
    clients.extension.send(JSON.stringify(message));
  }
}

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔍 MetaMask State Debugger                              ║
║                                                           ║
║   Server running at:  http://localhost:${PORT}              ║
║   WebSocket at:       ws://localhost:${PORT}                ║
║                                                           ║
║   Open the URL above in your browser to view state.       ║
║   Make sure MetaMask is running with state hooks enabled. ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
});

