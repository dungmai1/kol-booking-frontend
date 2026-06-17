'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Paperclip, Send, XCircle } from 'lucide-react';
import { bookingsApi } from '@/lib/api/bookings';
import type { BookingMessageResponse } from '@/lib/api/types';
import { useSse } from '@/hooks/use-sse';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function sanitizeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

interface BookingChatTabProps {
  bookingId: number;
  currentUserId: number;
}

export function BookingChatTab({ bookingId, currentUserId }: BookingChatTabProps) {
  const [messages, setMessages] = useState<BookingMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [attachError, setAttachError] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [connected, setConnected] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Tracks whether SSE has ever connected; prevents a duplicate load on initial mount
  // (useEffect already issues the first fetch; only reconnects need a reload).
  const sseHasConnectedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  // Returns true when the scroll container is close enough to the bottom that
  // auto-scrolling on a new message won't surprise the user.
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
        const res = await bookingsApi.getMessages(bookingId, targetPage, 50);
        const ordered = [...res.content].reverse();
        if (append) {
          setMessages((prev) => [...ordered, ...prev]);
        } else {
          // Preserve scroll position when refreshing on reconnect:
          // only jump to bottom if user was already there.
          const wasNearBottom = isNearBottom();
          setMessages(ordered);
          if (wasNearBottom) {
            setTimeout(scrollToBottom, 0);
          }
        }
        setHasMore(res.hasNext);
        setPage(targetPage);
      } catch {
        setError('Không thể tải tin nhắn.');
      } finally {
        setLoading(false);
      }
    },
    [bookingId, scrollToBottom, isNearBottom],
  );

  const handleSseEvent = useCallback(
    (eventName: string, data: string) => {
      if (eventName === 'message') {
        try {
          const msg: BookingMessageResponse = JSON.parse(data);
          // Capture scroll position before updating state (state update is async).
          const atBottom = isNearBottom();
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (atBottom) {
            setTimeout(scrollToBottom, 0);
          }
        } catch {
          // malformed JSON — ignore
        }
      }
    },
    [scrollToBottom, isNearBottom],
  );

  const handleSseConnect = useCallback(() => {
    setConnected(true);
    if (sseHasConnectedRef.current) {
      // Re-connect after a disconnect — reload to recover any missed messages.
      loadMessages(0, false);
    }
    // Mark that SSE has established at least one connection so future
    // reconnects know to trigger a reload.
    sseHasConnectedRef.current = true;
  }, [loadMessages]);

  // Must be a stable useCallback reference — an inline arrow function would
  // create a new reference on every render, causing useSse to restart the SSE
  // connection on every state update and breaking real-time delivery.
  const handleSseDisconnect = useCallback(() => setConnected(false), []);

  useSse({
    path: `/bookings/${bookingId}/messages/stream`,
    enabled: true,
    onEvent: handleSseEvent,
    onConnect: handleSseConnect,
    onDisconnect: handleSseDisconnect,
  });

  useEffect(() => {
    loadMessages(0, false);
  }, [loadMessages]);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }

  function handleAttachConfirm() {
    const url = attachmentInput.trim();
    if (!url) {
      setAttachmentUrl('');
      setShowAttachInput(false);
      setAttachError('');
      setAttachmentInput('');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setAttachError('URL phải bắt đầu bằng https:// hoặc http://');
      return;
    }
    setAttachmentUrl(url);
    setShowAttachInput(false);
    setAttachError('');
    setAttachmentInput('');
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSendError('');
    setSending(true);
    try {
      const sent = await bookingsApi.sendMessage(bookingId, {
        content: trimmed,
        attachmentUrl: attachmentUrl || undefined,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setContent('');
      setAttachmentUrl('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTimeout(scrollToBottom, 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gửi tin nhắn thất bại. Vui lòng thử lại.';
      setSendError(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="pin-card p-0 overflow-hidden flex flex-col h-[min(70vh,640px)]">
      <div className="px-4 py-3 border-b border-hairline-soft flex items-center justify-between gap-2">
        <p className="text-sm text-mute">
          {messages.length} tin nhắn
          {hasMore ? ' (còn cũ hơn)' : ''}
        </p>
        <div className="flex items-center gap-3">
          {hasMore && (
            <button
              type="button"
              onClick={() => loadMessages(page + 1, true)}
              disabled={loading}
              className="text-xs font-bold text-ink hover:underline disabled:opacity-50"
            >
              Xem tin cũ hơn
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs text-mute select-none">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            {connected ? 'Trực tuyến' : 'Đang kết nối...'}
          </span>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink" />
          </div>
        ) : messages.length === 0 ? (
          error ? (
            <p className="text-center text-pin-red text-sm py-12">{error}</p>
          ) : (
            <div className="text-center py-12 text-mute text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
              Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
            </div>
          )
        ) : (
          <>
            {error && (
              <p className="text-center text-pin-red text-xs py-1">{error}</p>
            )}
            {messages.map((msg) => {
            const mine = msg.senderUserId === currentUserId;
            const safeHref = sanitizeHref(msg.attachmentUrl);
            return (
              <div
                key={msg.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? 'bg-ink text-on-dark rounded-br-sm'
                      : 'bg-surface-card text-ink rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  {safeHref && (
                    <a
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-1 inline-flex items-center gap-1 text-xs font-bold underline ${
                        mine ? 'text-on-dark' : 'text-ink'
                      }`}
                    >
                      <Paperclip className="w-3 h-3" />
                      Tệp đính kèm
                    </a>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? 'text-on-dark/70' : 'text-mute'
                    }`}
                  >
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
            })}
          </>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-hairline-soft p-3 flex flex-col gap-2"
      >
        {/* Attachment URL inline input */}
        {showAttachInput && (
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={attachmentInput}
              onChange={(e) => {
                setAttachmentInput(e.target.value);
                setAttachError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAttachConfirm(); }
                if (e.key === 'Escape') { setShowAttachInput(false); setAttachmentInput(''); setAttachError(''); }
              }}
              placeholder="https://example.com/file.pdf"
              autoFocus
              className="pin-input flex-1 text-sm"
            />
            <button
              type="button"
              onClick={handleAttachConfirm}
              className="text-xs font-bold text-ink px-3 py-2 rounded-lg bg-surface-card hover:bg-secondary-bg transition-colors"
            >
              Xác nhận
            </button>
            <button
              type="button"
              onClick={() => { setShowAttachInput(false); setAttachmentInput(''); setAttachError(''); }}
              className="text-mute hover:text-ink"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {attachError && (
          <p className="text-xs text-pin-red pl-1">{attachError}</p>
        )}

        {/* Selected attachment preview */}
        {attachmentUrl && (
          <div className="flex items-center justify-between gap-2 text-xs bg-surface-card rounded-lg px-3 py-1.5">
            <span className="truncate text-mute flex items-center gap-1.5">
              <Paperclip className="w-3 h-3" />
              {attachmentUrl}
            </span>
            <button
              type="button"
              onClick={() => setAttachmentUrl('')}
              className="text-mute hover:text-ink"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSendError('');
              autoGrow(e.target);
            }}
            placeholder="Nhập tin nhắn..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            className="pin-input flex-1 min-h-[44px] max-h-32 resize-none overflow-y-auto"
          />
          <button
            type="button"
            onClick={() => { setShowAttachInput((v) => !v); setAttachmentInput(''); setAttachError(''); }}
            className={`grid place-items-center w-11 h-11 rounded-full transition-colors ${
              attachmentUrl
                ? 'bg-ink text-on-dark'
                : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
            aria-label="Đính kèm tệp"
            title="Đính kèm URL tệp"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="grid place-items-center w-11 h-11 rounded-full bg-ink text-on-dark hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="Gửi"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {sendError && (
          <p className="text-xs text-pin-red pl-1">{sendError}</p>
        )}
      </form>
    </section>
  );
}
