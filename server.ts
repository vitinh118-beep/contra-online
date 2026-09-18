import express from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface PlayerSession {
  ws: WebSocket;
  playerId: 1 | 2;
  name: string;
  ready: boolean;
  lastPing: number;
  pingMs: number;
}

interface GameRoom {
  code: string;
  createdAt: number;
  host: PlayerSession;
  guest: PlayerSession | null;
  status: 'waiting' | 'playing';
}

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-memory Room Storage
const rooms = new Map<string, GameRoom>();

// Helper to generate 4-character room codes
function generateRoomCode(): string {
  let code = '';
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 100; attempt++) {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!rooms.has(code)) return code;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

// REST API for network info (LAN IP detection)
app.get('/api/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const lanIps: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // IPv4 and non-internal
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIps.push(iface.address);
      }
    }
  }

  res.json({
    status: 'ok',
    lanIps,
    suggestedLanUrl: lanIps.length > 0 ? `http://${lanIps[0]}:${PORT}` : `http://localhost:${PORT}`,
    activeRoomsCount: rooms.size,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// WebSocket Server attached to HTTP server on path /ws
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let playerRole: 'host' | 'guest' | null = null;

  const send = (msg: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type } = data;

      switch (type) {
        // 1. Create a new room (Player 1 / Host)
        case 'create_room': {
          const code = generateRoomCode();
          const hostSession: PlayerSession = {
            ws,
            playerId: 1,
            name: data.playerName || 'BILL (Host)',
            ready: true,
            lastPing: Date.now(),
            pingMs: 0,
          };

          const newRoom: GameRoom = {
            code,
            createdAt: Date.now(),
            host: hostSession,
            guest: null,
            status: 'waiting',
          };

          rooms.set(code, newRoom);
          currentRoomCode = code;
          playerRole = 'host';

          send({
            type: 'room_created',
            code,
            playerId: 1,
            role: 'host',
            message: `Phòng ${code} đã được tạo thành công!`,
          });
          break;
        }

        // 2. Join existing room (Player 2 / Guest)
        case 'join_room': {
          const targetCode = String(data.code || '').trim().toUpperCase();
          const room = rooms.get(targetCode);

          if (!room) {
            send({
              type: 'error',
              message: `Không tìm thấy phòng "${targetCode}". Vui lòng kiểm tra lại mã phòng!`,
            });
            return;
          }

          if (room.guest && room.guest.ws.readyState === WebSocket.OPEN) {
            send({
              type: 'error',
              message: `Phòng ${targetCode} đã có đủ 2 người chơi!`,
            });
            return;
          }

          const guestSession: PlayerSession = {
            ws,
            playerId: 2,
            name: data.playerName || 'LANCE (Khách)',
            ready: true,
            lastPing: Date.now(),
            pingMs: 0,
          };

          room.guest = guestSession;
          currentRoomCode = targetCode;
          playerRole = 'guest';

          // Notify guest
          send({
            type: 'room_joined',
            code: targetCode,
            playerId: 2,
            role: 'guest',
            hostName: room.host.name,
            message: `Đã vào phòng ${targetCode} thành công!`,
          });

          // Notify host
          if (room.host.ws.readyState === WebSocket.OPEN) {
            room.host.ws.send(
              JSON.stringify({
                type: 'peer_joined',
                peerName: guestSession.name,
                playerId: 2,
                message: `${guestSession.name} đã tham gia phòng!`,
              })
            );
          }
          break;
        }

        // 3. Start Game (Triggered by Host)
        case 'start_game': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || playerRole !== 'host') return;

          room.status = 'playing';

          const startPayload = {
            type: 'game_started',
            config: data.config || {},
          };

          // Send to both host & guest
          send(startPayload);
          if (room.guest && room.guest.ws.readyState === WebSocket.OPEN) {
            room.guest.ws.send(JSON.stringify(startPayload));
          }
          break;
        }

        // 4. Input forwarding (Guest input -> Host, Host input -> Guest)
        case 'player_input': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const targetWs = playerRole === 'host' ? room.guest?.ws : room.host.ws;
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(
              JSON.stringify({
                type: 'peer_input',
                playerId: playerRole === 'host' ? 1 : 2,
                input: data.input,
              })
            );
          }
          break;
        }

        // 5. State snapshot synchronization (Host -> Guest)
        case 'state_sync': {
          if (!currentRoomCode || playerRole !== 'host') return;
          const room = rooms.get(currentRoomCode);
          if (!room || !room.guest || room.guest.ws.readyState !== WebSocket.OPEN) return;

          room.guest.ws.send(
            JSON.stringify({
              type: 'state_sync',
              snapshot: data.snapshot,
            })
          );
          break;
        }

        // 6. Sound & Game Events forwarding (Host -> Guest)
        case 'game_event': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const targetWs = playerRole === 'host' ? room.guest?.ws : room.host.ws;
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(
              JSON.stringify({
                type: 'game_event',
                event: data.event,
                payload: data.payload,
              })
            );
          }
          break;
        }

        // 7. Quick Chat / Taunt / Voice Lines
        case 'chat_message': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const chatPayload = {
            type: 'chat_message',
            sender: playerRole === 'host' ? 'BILL (P1)' : 'LANCE (P2)',
            text: data.text,
            time: Date.now(),
          };

          send(chatPayload);
          const targetWs = playerRole === 'host' ? room.guest?.ws : room.host.ws;
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify(chatPayload));
          }
          break;
        }

        // 8. Ping / Pong for latency measurement
        case 'ping': {
          send({
            type: 'pong',
            clientTimestamp: data.timestamp,
            serverTimestamp: Date.now(),
          });
          break;
        }

        // 9. Leave Room
        case 'leave_room': {
          handleDisconnect();
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });

  const handleDisconnect = () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    if (playerRole === 'host') {
      // Host left, room is closed
      if (room.guest && room.guest.ws.readyState === WebSocket.OPEN) {
        room.guest.ws.send(
          JSON.stringify({
            type: 'peer_left',
            message: 'Chủ phòng đã thoát. Phòng đã đóng!',
          })
        );
      }
      rooms.delete(currentRoomCode);
    } else if (playerRole === 'guest') {
      // Guest left
      room.guest = null;
      room.status = 'waiting';
      if (room.host.ws.readyState === WebSocket.OPEN) {
        room.host.ws.send(
          JSON.stringify({
            type: 'peer_left',
            message: 'Người chơi 2 đã ngắt kết nối!',
          })
        );
      }
    }

    currentRoomCode = null;
    playerRole = null;
  };

  ws.on('close', handleDisconnect);
  ws.on('error', handleDisconnect);
});

// Periodic cleanup of stale rooms (older than 3 hours)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 60000);

// Vite middleware or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Contra Game Server running on port ${PORT}`);
  });
}

startServer();
