const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Get local IP for LAN
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (let iface in interfaces) {
    for (let ifaceDetails of interfaces[iface]) {
      if (
        ifaceDetails.family === 'IPv4' &&
        !ifaceDetails.internal &&
        ifaceDetails.address.startsWith('192.')
      ) {
        return ifaceDetails.address;
      }
    }
  }
  return 'localhost';
}
// const IP = getLocalIPAddress();
const IP = "anonychat-sudhir.vercel.app"

// ✅ Enable CORS for all routes and origins
app.use(cors({
  origin: `http://${IP}`, // or '*' for all, but safer to restrict
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store one room ID
let currentRoomID = null;

// API: Save the current room ID
app.post('/save-room', (req, res) => {
  const { roomId } = req.body;
  if (roomId) {
    currentRoomID = roomId;
    console.log(`📌 Room ID set to: ${roomId}`);
    return res.status(200).json({ message: 'Room ID saved successfully.' });
  }
  console.log('❌ Room ID is required.');
  res.status(400).json({ error: 'Room ID is required.' });
});

// API: Get the current room ID
app.get('/get-room', (req, res) => {
  res.json({ roomId: currentRoomID });
});

// API: Delete (nullify) the current room ID
app.post('/delete-room', (req, res) => {
  currentRoomID = null;
  console.log('🗑️ Room ID deleted (set to null).');
  res.status(200).json({ message: 'Room ID deleted successfully.' });
});

// WebSocket communication
wss.on('connection', (ws) => {
  console.log('🔗 New client connected');

  ws.on('message', (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log(`📩 Message from client: ${message.length > 70 ? message.subarray(0,70) : message}`);
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});

server.listen(3000, () => {
  console.log(`✅ Server running at http://${IP}:3000`);
});