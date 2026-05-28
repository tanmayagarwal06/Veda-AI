'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '@/store/socketStore';
import type { WSMessage } from '@/types/index';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

interface UseWebSocketOptions {
  assignmentId: string;
  onComplete?: (paperId: string) => void;
  onFailed?: (error: string) => void;
  onProgress?: (progress: number, message: string) => void;
}

export function useWebSocket({
  assignmentId,
  onComplete,
  onFailed,
  onProgress,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnects = 3;
  const intentionalClose = useRef(false);

  // Store callbacks in refs — inline functions passed as props change every render,
  // which would recreate `connect` and retrigger the effect causing an infinite loop.
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);
  const onProgressRef = useRef(onProgress);

  // keep latest callbacks in sync each render without triggering re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onFailedRef.current = onFailed;
    onProgressRef.current = onProgress;
  });

  // Zustand setters are stable references — safe to use as useCallback deps
  const setWs = useSocketStore((s) => s.setWs);
  const setConnectionStatus = useSocketStore((s) => s.setConnectionStatus);
  const setProgress = useSocketStore((s) => s.setProgress);
  const setComplete = useSocketStore((s) => s.setComplete);
  const setFailed = useSocketStore((s) => s.setFailed);

  const connect = useCallback(() => {
    if (!assignmentId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;
    setWs(ws);

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      intentionalClose.current = false;
      setConnectionStatus('connected');
      ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data as string);

        if (msg.type === 'job:progress') {
          setProgress(msg.progress, msg.message);
          onProgressRef.current?.(msg.progress, msg.message);
        } else if (msg.type === 'job:complete') {
          intentionalClose.current = true;
          setComplete(msg.paperId);
          onCompleteRef.current?.(msg.paperId);
          ws.close();
        } else if (msg.type === 'job:failed') {
          intentionalClose.current = true;
          setFailed(msg.error);
          onFailedRef.current?.(msg.error);
          ws.close();
        }
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      wsRef.current = null;
      setWs(null);

      if (!intentionalClose.current && reconnectAttempts.current < maxReconnects) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
        setTimeout(connect, delay);
      }
    };
  }, [assignmentId, setWs, setConnectionStatus, setProgress, setComplete, setFailed]);

  useEffect(() => {
    connect();
    return () => {
      // Stop reconnect attempts on unmount
      reconnectAttempts.current = maxReconnects;
      wsRef.current?.close();
    };
  }, [connect]);

  return { reconnect: connect };
}
