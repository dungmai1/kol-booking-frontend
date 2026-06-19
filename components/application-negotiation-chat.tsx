'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { applicationsApi } from '@/lib/api/applications';
import { ApiError } from '@/lib/api/client';
import type { ApplicationMessageResponse } from '@/lib/api/types';
import { useSse } from '@/hooks/use-sse';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export interface ApplicationNegotiationChatProps {
  applicationId: number;
  currentUserId: number;
  currentUserRole: 'KOL' | 'BRAND';
  /** True when status is WITHDRAWN / REJECTED / BOOKING_CANCELLED — input disabled. */
  isTerminal: boolean;
}

export function ApplicationNegotiationChat({
  applicationId,
  currentUserId,
  currentUserRole,
  isTerminal,
}: ApplicationNegotiationChatProps) {
  const [messages, setMessages] = useState<ApplicationMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sseHasConnectedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const loadMessages = useCallback(
    async (targetPage: number, append: boolean) => {
      setLoading(true);
      setError('');
      try {
        const res = await applicationsApi.listMessages(applicationId, targetPage, 50);
        const ordered = [...res.content].reverse();
        if (append) {
          setMessages((prev) => [...ordered, ...prev]);
        } else {
          const wasNearBottom = isNearBottom();
          setMessages(ordered);
          if (wasNearBottom) setTimeout(scrollToBottom, 0);
        }
        setHasMore(res.hasNext);
        setPage(targetPage);
        setReady(true);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Không thể tải tin nhắn.');
      } finally {
        setLoading(false);
      }
    },
    [applicationId, scrollToBottom, isNearBottom],
  );

  const handleSseEvent = useCallback(
    (eventName: string, data: string) => {
      if (eventName === 'message') {
        try {
          const msg: ApplicationMessageResponse = JSON.parse(data);
          const atBottom = isNearBottom();
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (atBottom) setTimeout(scrollToBottom, 0);
        } catch {
          // malformed JSON
        }
      }
    },
    [scrollToBottom, isNearBottom],
  );

  const handleSseConnect = useCallback(() => {
    setConnected(true);
    if (sseHasConnectedRef.current) {
      loadMessages(0, false);
    }
    sseHasConnectedRef.current = true;
  }, [loadMessages]);

  // Stable reference — inline arrow would restart SSE on every render.
  const handleSseDisconnect = useCallback(() => setConnected(false), []);

  useSse({
    path: `/applications/${applicationId}/messages/stream`,
    enabled: true,
    onEvent: handleSseEvent,
    onConnect: handleSseConnect,
    onDisconnect: handleSseDisconnect,
  });

  // Polling fallback: when SSE is not connected, poll every 4 s so messages still arrive.
  useEffect(() => {
    if (connected) return;
    const id = setInterval(() => loadMessages(0, false), 4_000);
    return () => clearInterval(id);
  }, [connected, loadMessages]);

  useEffect(() => {
    loadMessages(0, false);
  }, [loadMessages]);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending || isTerminal) return;
    setSendError('');
    setSending(true);
    try {
      const sent = await applicationsApi.sendMessage(applicationId, trimmed);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Gửi thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

  const otherRole = currentUserRole === 'KOL' ? 'BRAND' : 'KOL';

  return (
    <div className="flex flex-col h-[min(60vh,520px)] bg-canvas rounded-xl border border-hairline overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-hairline-soft flex items-center justify-between gap-2 bg-surface-soft">
        <p className="text-xs text-mute font-medium">
          {messages.length > 0 ? `${messages.length} tin nhắn` : 'Tin nhắn thương lượng'}
          {hasMore ? ' (còn cũ hơn)' : ''}
        </p>
        <div className="flex items-center gap-3">
          {hasMore && !loading && (
            <button
              type="button"
              onClick={() => loadMessages(page + 1, true)}
              className="text-xs font-bold text-ink hover:underline"
            >
              Xem tin cũ hơn
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs text-mute select-none">
            <span className={`inline-block w-2 h-2 rounded-full ${connected || ready ? 'bg-green-500' : 'bg-gray-400'}`} />
            {connected || ready ? 'Trực tuyến' : 'Đang kết nối...'}
          </span>
        </div>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {loading && messages.length === 0 ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-ink" />
          </div>
        ) : messages.length === 0 ? (
          error ? (
            <p className="text-center text-pin-red text-sm py-10">{error}</p>
          ) : (
            <div className="text-center py-10 text-mute text-sm">
              <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
              Chưa có tin nhắn. Bắt đầu thương lượng ngay!
            </div>
          )
        ) : (
          <>
            {error && <p className="text-center text-pin-red text-xs">{error}</p>}
            {messages.map((msg) => {
              const mine = msg.senderUserId === currentUserId;
              const isKolMsg = msg.senderRole === 'KOL';
              return (
                <div key={msg.id} className={`flex flex-col gap-0.5 ${mine ? 'items-end' : 'items-start'}`}>
                  {/* Role badge — only show for the other party */}
                  {!mine && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isKolMsg
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {msg.senderRole === 'KOL' ? 'KOL' : 'Brand'}
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? 'bg-ink text-on-dark rounded-br-sm'
                        : isKolMsg
                        ? 'bg-blue-50 text-blue-900 rounded-bl-sm border border-blue-100'
                        : 'bg-amber-50 text-amber-900 rounded-bl-sm border border-amber-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-on-dark/60' : 'text-mute'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input area */}
      {isTerminal ? (
        <div className="border-t border-hairline-soft px-4 py-3 text-xs text-mute text-center bg-surface-soft">
          Ứng tuyển đã kết thúc — không thể gửi tin nhắn mới.
        </div>
      ) : (
        <form onSubmit={handleSend} className="border-t border-hairline-soft p-3 flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSendError('');
                autoGrow(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              placeholder={`Nhắn tin với ${otherRole === 'KOL' ? 'KOL' : 'Brand'}…`}
              rows={1}
              className="pin-input flex-1 min-h-[40px] max-h-32 resize-none overflow-y-auto text-sm"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="grid place-items-center w-10 h-10 rounded-full bg-ink text-on-dark hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
              aria-label="Gửi"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {sendError && <p className="text-xs text-pin-red">{sendError}</p>}
        </form>
      )}
    </div>
  );
}
