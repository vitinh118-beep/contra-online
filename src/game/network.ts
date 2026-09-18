/**
 * Contra Multiplayer Real-Time Network Client
 * Supports LAN and Internet peer synchronization via WebSockets
 */

import { InputState } from '../types';

export interface NetworkStateSnapshot {
  tick: number;
  cameraX: number;
  cameraY: number;
  screenShake: number;
  status: string;
  levelIndex: number;
  p1: any;
  p2: any;
  bullets: any[];
  enemies: any[];
  powerUps: any[];
  npcs: any[];
  boss: any;
  scores: { p1: number; p2: number; high: number };
}

export type NetworkRole = 'host' | 'guest' | null;

export class ContraNetworkClient {
  public ws: WebSocket | null = null;
  public role: NetworkRole = null;
  public playerId: 1 | 2 | null = null;
  public roomCode: string | null = null;
  public isConnected: boolean = false;
  public pingMs: number = 0;

  // Callbacks
  public onRoomCreated?: (code: string) => void;
  public onRoomJoined?: (code: string, hostName: string) => void;
  public onPeerJoined?: (peerName: string) => void;
  public onPeerLeft?: (message: string) => void;
  public onGameStarted?: (config: any) => void;
  public onPeerInput?: (input: InputState, playerId: 1 | 2) => void;
  public onStateSync?: (snapshot: NetworkStateSnapshot) => void;
  public onGameEvent?: (event: string, payload: any) => void;
  public onChatMessage?: (sender: string, text: string) => void;
  public onPingUpdate?: (ping: number) => void;
  public onError?: (message: string) => void;
  public onConnectionChange?: (connected: boolean) => void;

  private pingTimer: any = null;
  private reconnectTimeout: any = null;

  constructor() {
    // Auto initialize connection
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(true);
        return;
      }

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.onConnectionChange?.(true);
          this.startPingLoop();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (err) {
            console.error('Failed to parse network message:', err);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.onConnectionChange?.(false);
          this.stopPingLoop();
        };

        this.ws.onerror = (err) => {
          console.warn('Network WebSocket error:', err);
          this.isConnected = false;
          this.onConnectionChange?.(false);
          resolve(false);
        };
      } catch (e) {
        console.error('WS connection failed:', e);
        resolve(false);
      }
    });
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 2000);
  }

  private stopPingLoop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'room_created':
        this.role = 'host';
        this.playerId = 1;
        this.roomCode = data.code;
        this.onRoomCreated?.(data.code);
        break;

      case 'room_joined':
        this.role = 'guest';
        this.playerId = 2;
        this.roomCode = data.code;
        this.onRoomJoined?.(data.code, data.hostName);
        break;

      case 'peer_joined':
        this.onPeerJoined?.(data.peerName);
        break;

      case 'peer_left':
        this.onPeerLeft?.(data.message);
        break;

      case 'game_started':
        this.onGameStarted?.(data.config);
        break;

      case 'peer_input':
        this.onPeerInput?.(data.input, data.playerId);
        break;

      case 'state_sync':
        this.onStateSync?.(data.snapshot);
        break;

      case 'game_event':
        this.onGameEvent?.(data.event, data.payload);
        break;

      case 'chat_message':
        this.onChatMessage?.(data.sender, data.text);
        break;

      case 'pong':
        if (data.clientTimestamp) {
          const rtt = Date.now() - data.clientTimestamp;
          this.pingMs = Math.round(rtt);
          this.onPingUpdate?.(this.pingMs);
        }
        break;

      case 'error':
        this.onError?.(data.message || 'Lỗi kết nối');
        break;

      default:
        break;
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public async createRoom(playerName: string = 'BILL (Host)') {
    await this.connect();
    this.send({ type: 'create_room', playerName });
  }

  public async joinRoom(code: string, playerName: string = 'LANCE (Khách)') {
    await this.connect();
    this.send({ type: 'join_room', code, playerName });
  }

  public startGame(config: any) {
    this.send({ type: 'start_game', config });
  }

  public sendInput(input: InputState) {
    this.send({
      type: 'player_input',
      input: {
        left: input.left,
        right: input.right,
        up: input.up,
        down: input.down,
        jump: input.jump,
        shoot: input.shoot,
        prevJump: input.prevJump,
        prevShoot: input.prevShoot,
      },
    });
  }

  public sendStateSync(snapshot: NetworkStateSnapshot) {
    this.send({ type: 'state_sync', snapshot });
  }

  public sendGameEvent(event: string, payload?: any) {
    this.send({ type: 'game_event', event, payload });
  }

  public sendChatMessage(text: string) {
    this.send({ type: 'chat_message', text });
  }

  public leaveRoom() {
    this.send({ type: 'leave_room' });
    this.role = null;
    this.playerId = null;
    this.roomCode = null;
  }
}

export const network = new ContraNetworkClient();
