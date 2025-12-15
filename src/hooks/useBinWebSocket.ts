import { useEffect, useState } from 'react';
import { binWebSocket } from '../services/websocket';
import { BinUpdateMessage } from '../types/api';

interface UseBinWebSocketResult {
  connected: boolean;
  latestUpdate: BinUpdateMessage | null;
}

/**
 * Hook to manage WebSocket connection and receive real-time bin updates
 */
export function useBinWebSocket(schoolId: string | null): UseBinWebSocketResult {
  const [connected, setConnected] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<BinUpdateMessage | null>(null);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    const schoolIdNum = parseInt(schoolId);

    // Connect to WebSocket
    binWebSocket.connect(schoolIdNum);

    // Register handlers
    const unsubscribeConnection = binWebSocket.onConnectionChange(setConnected);
    const unsubscribeBinUpdate = binWebSocket.onBinUpdate((update) => {
      console.log('Received bin update:', update);
      setLatestUpdate(update);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeConnection();
      unsubscribeBinUpdate();
      binWebSocket.disconnect();
    };
  }, [schoolId]);

  return {
    connected,
    latestUpdate,
  };
}
