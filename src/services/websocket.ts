import {
  WebSocketMessage,
  ConnectionMessage,
  BinUpdateMessage,
  SubscriptionMessage,
} from '../types/api';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || `ws://${window.location.host}`;

type MessageHandler = (message: WebSocketMessage) => void;
type BinUpdateHandler = (update: BinUpdateMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

/**
 * WebSocket service for real-time bin updates
 */
export class BinWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private schoolId: number | null = null;

  private messageHandlers: Set<MessageHandler> = new Set();
  private binUpdateHandlers: Set<BinUpdateHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();

  /**
   * Connect to the WebSocket server
   */
  connect(schoolId: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.schoolId = schoolId;
    const url = `${WS_BASE_URL}/ws/bins?schoolId=${schoolId}`;

    console.log(`Connecting to WebSocket: ${url}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers(true);
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.notifyConnectionHandlers(false);
        this.stopPingInterval();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a specific school's updates
   */
  subscribe(schoolId: number): void {
    this.schoolId = schoolId;
    this.sendMessage({
      type: 'subscribe',
      schoolId,
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    // Notify all generic message handlers
    this.messageHandlers.forEach((handler) => handler(message));

    // Handle specific message types
    switch (message.type) {
      case 'connection':
        console.log('Connection established:', (message as ConnectionMessage).message);
        break;

      case 'bin_update':
        const binUpdate = message as BinUpdateMessage;
        console.log(`Bin update received for bin ${binUpdate.binId}`);
        this.binUpdateHandlers.forEach((handler) => handler(binUpdate));
        break;

      case 'subscription':
        const subMessage = message as SubscriptionMessage;
        console.log(`Subscribed to school ${subMessage.schoolId}`);
        break;

      case 'pong':
        // Keep-alive response
        break;

      default:
        console.log('Unknown message type:', message);
    }
  }

  /**
   * Send a message to the server
   */
  private sendMessage(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Start sending periodic ping messages
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop the ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!this.schoolId) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.schoolId!);
    }, delay);
  }

  /**
   * Notify connection status handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }

  /**
   * Register a handler for all WebSocket messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a handler for bin update messages
   */
  onBinUpdate(handler: BinUpdateHandler): () => void {
    this.binUpdateHandlers.add(handler);
    return () => this.binUpdateHandlers.delete(handler);
  }

  /**
   * Register a handler for connection status changes
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const binWebSocket = new BinWebSocketService();
