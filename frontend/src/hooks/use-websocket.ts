'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';

type WebSocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function useWebsocket(endpoint?: string) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const connect = useCallback(() => {
    if (!isAuthenticated || !endpoint) return;
    
    try {
      setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}${endpoint}`);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'telemetry.updated') {
            queryClient.invalidateQueries({ queryKey: ['telemetry', data.device_id] });
          } else if (data.event === 'prediction.completed') {
            queryClient.invalidateQueries({ queryKey: ['predictions', data.device_id] });
            queryClient.invalidateQueries({ queryKey: ['devices', data.device_id] });
          } else if (data.event === 'alert.created') {
            queryClient.invalidateQueries({ queryKey: ['alerts', data.device_id] });
          }
        } catch (e) {
          console.error('Failed to parse websocket message', e);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;
        
        // Exponential backoff reconnect
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, timeout);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Failed to establish WebSocket', e);
    }
  }, [endpoint, queryClient, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, isAuthenticated]);

  return { status };
}
