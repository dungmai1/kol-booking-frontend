'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Paperclip, Send, XCircle } from 'lucide-react';
import { bookingsApi } from '@/lib/api/bookings';
import type { BookingMessageResponse } from '@/lib/api/types';

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
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
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
          setMessages(ordered);
          setTimeout(scrollToBottom, 0);
        }
        setHasMore(res.hasNext);
        setPage(targetPage);
      } catch {
        setError('Không thể tải tin nhắn.');
      } finally {
        setLoading(false);
      }
    },
    [bookingId, scrollToBottom],
  );

  useEffect(() => {
    loadMessages(0, false);
  }, [loadMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const sent = await bookingsApi.sendMessage(bookingId, {
        content: trimmed,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      setMessages((prev) => [...prev, sent]);
      setContent('');
      setAttachmentUrl('');
      setTimeout(scrollToBottom, 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi tin nhắn thất bại.';
      window.alert(message);
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
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink" />
          </div>
        ) : error ? (
          <p className="text-center text-pin-red text-sm py-12">{error}</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-mute text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderUserId === currentUserId;
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
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
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
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-hairline-soft p-3 flex items-end gap-2"
      >
        <div className="flex-1 flex flex-col gap-2">
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập tin nhắn..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            className="pin-input min-h-[44px] max-h-32 resize-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Đường dẫn tệp đính kèm:');
            if (url) setAttachmentUrl(url.trim());
          }}
          className="grid place-items-center w-11 h-11 rounded-full bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
          aria-label="Đính kèm tệp"
          title="Đính kèm tệp"
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
      </form>
    </section>
  );
}
