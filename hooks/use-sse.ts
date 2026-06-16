'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAccessToken, API_BASE_URL } from '@/lib/api/client';

interface SseOptions {
  path: string;            // e.g. '/notifications/stream'
  enabled: boolean;
  onEvent: (eventName: string, data: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

export function useSse({ path, enabled, onEvent, onConnect, onDisconnect }: SseOptions): void {
  const abortRef = useRef<AbortController | null>(null);
  const delayRef = useRef(BASE_DELAY_MS);
  const mountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!mountedRef.current || !enabled) return;
    const token = getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE connection failed: ${res.status}`);
      }

      onConnect?.();
      delayRef.current = BASE_DELAY_MS; // reset backoff on success

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      while (mountedRef.current) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data) onEvent(currentEvent, data);
            currentEvent = 'message'; // reset after dispatch
          } else if (line === '') {
            currentEvent = 'message'; // blank line = end of event block
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      onDisconnect?.();
    }

    // Reconnect with backoff
    if (mountedRef.current && enabled) {
      const delay = delayRef.current;
      delayRef.current = Math.min(delay * 2, MAX_DELAY_MS);
      await new Promise((r) => setTimeout(r, delay));
      connect();
    }
  }, [path, enabled, onEvent, onConnect, onDisconnect]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [enabled, connect]);
}
