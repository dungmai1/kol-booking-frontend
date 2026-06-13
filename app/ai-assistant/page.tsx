'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  History,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  SendHorizontal,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import {
  aiAssistantApi,
  type AiChatResponse,
  type KolRecommendationItem,
  type KolRecommendationPlatform,
  type KolSearchCriteria,
} from '@/lib/api/ai-assistant';
import { formatMinPrice } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  clarificationQuestions?: string[];
};

type ServiceStatus = 'checking' | 'ready' | 'processing' | 'error';
type ActivePanel = 'chat' | 'results';
type SortKey = 'matchScore' | 'followers' | 'price' | 'rating';

const STORAGE_KEY = 'kol_ai_assistant_conversation_id';
const HISTORY_STORAGE_KEY = 'kol_ai_assistant_conversation_history';
const MAX_HISTORY_ITEMS = 20;
const LOGIN_REDIRECT_URL = `/auth/login?redirect=${encodeURIComponent('/ai-assistant')}`;

type ConversationHistoryItem = {
  conversationId: string;
  title: string;
  updatedAt: string;
  messages: Message[];
  criteria: KolSearchCriteria;
  recommendations: KolRecommendationItem[];
  selectedKolId: number | null;
};

const EMPTY_CRITERIA: KolSearchCriteria = {
  category: null,
  platforms: [],
  minFollowers: null,
  maxFollowers: null,
  minBudget: null,
  maxBudget: null,
  location: null,
  gender: null,
  campaignGoal: null,
  serviceType: null,
};

const PROMPT_EXAMPLES = [
  'Tìm KOL thời trang trên TikTok, trên 100k follower',
  'Tìm creator làm review mỹ phẩm, ngân sách dưới 8 triệu',
  'Tìm YouTuber công nghệ có engagement tốt',
];

const QUICK_PLATFORM_REPLIES = ['TikTok', 'Instagram', 'YouTube', 'Facebook'];

export default function AiAssistantPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [criteria, setCriteria] = useState<KolSearchCriteria>(EMPTY_CRITERIA);
  const [recommendations, setRecommendations] = useState<KolRecommendationItem[]>([]);
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [sortKey, setSortKey] = useState<SortKey>('matchScore');
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    const history = readConversationHistory();
    setConversationHistory(history);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const savedConversation = history.find((item) => item.conversationId === saved);
    if (savedConversation) {
      hydrateConversation(savedConversation);
      return;
    }

    setConversationId(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    aiAssistantApi
      .health()
      .then(() => {
        if (!cancelled) setServiceStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setServiceStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, slowLoading]);

  useEffect(() => {
    if (!isLoading) {
      setSlowLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowLoading(true), 3000);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      if (sortKey === 'followers') return totalFollowers(b) - totalFollowers(a);
      if (sortKey === 'price') return nullablePrice(a.priceFrom) - nullablePrice(b.priceFrom);
      if (sortKey === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      return b.matchScore - a.matchScore;
    });
  }, [recommendations, sortKey]);

  const selectedKol = useMemo(() => {
    if (!sortedRecommendations.length) return null;
    return sortedRecommendations.find((kol) => kol.kolId === selectedKolId) ?? sortedRecommendations[0];
  }, [selectedKolId, sortedRecommendations]);

  async function sendMessage(text = input.trim()) {
    const message = text.trim();
    if (!message || isLoading) return;
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi tin nhắn cho AI.');
      router.push(LOGIN_REDIRECT_URL);
      return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: message };
    const nextMessages = [...messagesRef.current, userMessage];

    setError('');
    setIsLoading(true);
    setServiceStatus('processing');
    setConversationMessages(nextMessages);

    try {
      const response = await aiAssistantApi.chat({
        conversationId,
        message,
      });
      applyChatResponse(response);
      setInput('');
    } catch {
      setError('Không thể lấy đề xuất lúc này. Vui lòng thử lại sau.');
      setInput(message);
      setConversationMessages([
        ...messagesRef.current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Không thể lấy đề xuất lúc này. Vui lòng thử lại sau.',
        },
      ]);
      setServiceStatus('error');
    } finally {
      setIsLoading(false);
      setServiceStatus((current) => (current === 'processing' ? 'ready' : current));
    }
  }

  function applyChatResponse(response: AiChatResponse) {
    const nextCriteria = response.criteria ?? EMPTY_CRITERIA;
    const nextRecommendations = response.recommendations ?? [];
    const nextSelectedKolId = nextRecommendations[0]?.kolId ?? null;
    const nextMessages = [
      ...messagesRef.current,
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: response.reply,
        clarificationQuestions: response.clarificationQuestions,
      },
    ];

    setConversationId(response.conversationId);
    localStorage.setItem(STORAGE_KEY, response.conversationId);
    setCriteria(nextCriteria);
    setRecommendations(nextRecommendations);
    setSelectedKolId(nextSelectedKolId);
    setConversationMessages(nextMessages);
    upsertConversationHistory({
      conversationId: response.conversationId,
      title: getConversationTitle(nextMessages),
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
      criteria: nextCriteria,
      recommendations: nextRecommendations,
      selectedKolId: nextSelectedKolId,
    });
    if (nextRecommendations.length) {
      setActivePanel('results');
    }
  }

  function startNewConversation() {
    localStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setConversationMessages([]);
    setCriteria(EMPTY_CRITERIA);
    setRecommendations([]);
    setSelectedKolId(null);
    setInput('');
    setError('');
    setActivePanel('chat');
    setHistoryOpen(false);
  }

  function hydrateConversation(item: ConversationHistoryItem) {
    const nextCriteria = item.criteria ?? EMPTY_CRITERIA;
    const nextRecommendations = item.recommendations ?? [];

    setConversationId(item.conversationId);
    localStorage.setItem(STORAGE_KEY, item.conversationId);
    setConversationMessages(item.messages);
    setCriteria(nextCriteria);
    setRecommendations(nextRecommendations);
    setSelectedKolId(item.selectedKolId ?? nextRecommendations[0]?.kolId ?? null);
    setInput('');
    setError('');
    setActivePanel(nextRecommendations.length ? 'results' : 'chat');
    setHistoryOpen(false);
  }

  function deleteConversation(conversationToDelete: string) {
    const nextHistory = conversationHistory.filter((item) => item.conversationId !== conversationToDelete);
    writeConversationHistory(nextHistory);
    setConversationHistory(nextHistory);

    if (conversationId === conversationToDelete) {
      startNewConversation();
    }
  }

  function selectKol(kolId: number) {
    setSelectedKolId(kolId);
    if (!conversationId || messagesRef.current.length === 0) return;

    upsertConversationHistory({
      conversationId,
      title: getConversationTitle(messagesRef.current),
      updatedAt: new Date().toISOString(),
      messages: messagesRef.current,
      criteria,
      recommendations,
      selectedKolId: kolId,
    });
  }

  function setConversationMessages(nextMessages: Message[]) {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  }

  function upsertConversationHistory(item: ConversationHistoryItem) {
    const current = readConversationHistory();
    const nextHistory = [
      item,
      ...current.filter((historyItem) => historyItem.conversationId !== item.conversationId),
    ].slice(0, MAX_HISTORY_ITEMS);

    writeConversationHistory(nextHistory);
    setConversationHistory(nextHistory);
  }

  const chatPanel = (
    <ChatPanel
      messages={messages}
      input={input}
      isLoading={isLoading}
      slowLoading={slowLoading}
      error={error}
      onInputChange={setInput}
      onSend={() => sendMessage()}
      onPromptClick={setInput}
      onQuickReply={sendMessage}
      messagesEndRef={messagesEndRef}
      canSendChat={isAuthenticated}
      isAuthLoading={isAuthLoading}
    />
  );

  const resultsPanel = (
    <ResultsPanel
      criteria={criteria}
      recommendations={sortedRecommendations}
      selectedKol={selectedKol}
      sortKey={sortKey}
      onSortChange={setSortKey}
      onSelectKol={selectKol}
      onRetry={() => input.trim() && sendMessage()}
      hasConversation={messages.length > 0 || !!conversationId}
    />
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft text-body">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6">
          <section className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <AssistantHeader
              status={isLoading ? 'processing' : serviceStatus}
              conversationId={conversationId}
              brandLabel={isAuthenticated ? user?.email ?? 'Brand' : 'Chưa đăng nhập'}
              historyCount={conversationHistory.length}
              onOpenHistory={() => setHistoryOpen(true)}
              onNewConversation={startNewConversation}
            />
            <ConversationHistorySheet
              open={historyOpen}
              conversations={conversationHistory}
              activeConversationId={conversationId}
              onOpenChange={setHistoryOpen}
              onSelect={hydrateConversation}
              onDelete={deleteConversation}
              onNewConversation={startNewConversation}
            />

            <div className="lg:hidden border-b border-hairline-soft bg-surface-soft px-3 py-2">
              <div className="grid grid-cols-2 rounded-full bg-secondary-bg p-1">
                <button
                  onClick={() => setActivePanel('chat')}
                  className={`h-9 rounded-full text-sm font-bold transition-colors ${
                    activePanel === 'chat' ? 'bg-canvas text-ink shadow-sm' : 'text-mute'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActivePanel('results')}
                  className={`h-9 rounded-full text-sm font-bold transition-colors ${
                    activePanel === 'results' ? 'bg-canvas text-ink shadow-sm' : 'text-mute'
                  }`}
                >
                  Kết quả {recommendations.length > 0 ? `(${recommendations.length})` : ''}
                </button>
              </div>
            </div>

            <div className="grid min-h-[calc(100vh-148px)] lg:grid-cols-[minmax(360px,38%)_minmax(0,62%)]">
              <div className={`border-r border-hairline-soft ${activePanel === 'chat' ? 'block' : 'hidden'} lg:block`}>
                {chatPanel}
              </div>
              <div className={`${activePanel === 'results' ? 'block' : 'hidden'} lg:block`}>
                {resultsPanel}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function AssistantHeader({
  status,
  conversationId,
  brandLabel,
  historyCount,
  onOpenHistory,
  onNewConversation,
}: {
  status: ServiceStatus;
  conversationId: string | null;
  brandLabel: string;
  historyCount: number;
  onOpenHistory: () => void;
  onNewConversation: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-hairline-soft bg-canvas px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[22px] font-bold text-ink sm:text-[26px]">
            Tìm KOL bằng AI
          </h1>
          <StatusPill status={status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mute">
          <span className="truncate">{brandLabel}</span>
          {conversationId && (
            <>
              <span className="h-1 w-1 rounded-full bg-ash" aria-hidden />
              <span className="truncate">Conversation {conversationId.slice(0, 8)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button onClick={onOpenHistory} className="btn-pin-secondary !rounded-full">
          <History className="h-4 w-4" />
          Lịch sử{historyCount > 0 ? ` (${historyCount})` : ''}
        </button>
        <button onClick={onNewConversation} className="btn-pin-secondary !rounded-full">
          <MessageSquarePlus className="h-4 w-4" />
          Cuộc trò chuyện mới
        </button>
      </div>
    </div>
  );
}

function ConversationHistorySheet({
  open,
  conversations,
  activeConversationId,
  onOpenChange,
  onSelect,
  onDelete,
  onNewConversation,
}: {
  open: boolean;
  conversations: ConversationHistoryItem[];
  activeConversationId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: ConversationHistoryItem) => void;
  onDelete: (conversationId: string) => void;
  onNewConversation: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-hairline bg-canvas p-0 sm:max-w-md">
        <SheetHeader className="border-b border-hairline-soft p-5 pr-12">
          <SheetTitle className="font-display text-[22px] font-bold text-ink">
            Lịch sử trò chuyện
          </SheetTitle>
          <SheetDescription className="text-sm text-mute">
            Mở lại các cuộc trò chuyện AI đã dùng trên trình duyệt này.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="rounded-md border border-dashed border-hairline bg-surface-soft p-5 text-sm leading-6 text-mute">
              Chưa có lịch sử. Sau khi AI phản hồi, cuộc trò chuyện sẽ được lưu tại đây.
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isActive = conversation.conversationId === activeConversationId;
                const recommendationCount = conversation.recommendations.length;

                return (
                  <div
                    key={conversation.conversationId}
                    className={`flex gap-2 rounded-md border bg-surface-soft p-2 transition-colors ${
                      isActive ? 'border-ink' : 'border-hairline hover:border-ink'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(conversation)}
                      className="min-w-0 flex-1 rounded-md px-2 py-2 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">{conversation.title}</p>
                        {isActive && (
                          <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase text-on-dark">
                            Đang mở
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-mute">
                        {formatConversationTime(conversation.updatedAt)}
                        {recommendationCount > 0 ? ` · ${recommendationCount} KOL` : ''}
                      </p>
                      <p className="mt-1 truncate text-xs text-ash">
                        Conversation {conversation.conversationId.slice(0, 8)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(conversation.conversationId)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-secondary-bg hover:text-ink"
                      aria-label={`Xóa ${conversation.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-hairline-soft p-4">
          <button onClick={onNewConversation} className="btn-pin-primary !rounded-full w-full">
            <MessageSquarePlus className="h-4 w-4" />
            Cuộc trò chuyện mới
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusPill({ status }: { status: ServiceStatus }) {
  const data: Record<ServiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
    checking: {
      label: 'Đang kiểm tra',
      className: 'bg-surface-card text-mute',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    ready: {
      label: 'Sẵn sàng',
      className: 'bg-success-pale text-success-deep',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    processing: {
      label: 'Đang xử lý',
      className: 'bg-ink text-on-dark',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    error: {
      label: 'Lỗi backend',
      className: 'bg-pin-red text-on-dark',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${data[status].className}`}>
      {data[status].icon}
      {data[status].label}
    </span>
  );
}

function ChatPanel({
  messages,
  input,
  isLoading,
  slowLoading,
  error,
  onInputChange,
  onSend,
  onPromptClick,
  onQuickReply,
  messagesEndRef,
  canSendChat,
  isAuthLoading,
}: {
  messages: Message[];
  input: string;
  isLoading: boolean;
  slowLoading: boolean;
  error: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onPromptClick: (value: string) => void;
  onQuickReply: (value: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  canSendChat: boolean;
  isAuthLoading: boolean;
}) {
  return (
    <div className="flex h-full min-h-[calc(100vh-194px)] flex-col bg-canvas">
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="flex min-h-[420px] flex-col justify-center">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-on-dark">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="font-display text-[22px] font-bold text-ink">
              Nhập nhu cầu tìm KOL để bắt đầu.
            </h2>
            <p className="mt-2 max-w-[420px] text-sm leading-6 text-mute">
              Mô tả ngành hàng, nền tảng, follower, ngân sách hoặc mục tiêu chiến dịch bằng tiếng Việt.
            </p>
            <div className="mt-6 space-y-2">
              {PROMPT_EXAMPLES.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onPromptClick(prompt)}
                  className="block w-full rounded-md border border-hairline bg-surface-soft px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onQuickReply={onQuickReply} disabled={isLoading} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-on-dark">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="rounded-md bg-surface-card px-4 py-3 text-sm text-ink">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {slowLoading ? 'Đang lấy dữ liệu KOL phù hợp...' : 'Đang phân tích yêu cầu...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-hairline-soft bg-canvas p-3 sm:p-4">
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-pin-red/30 bg-pin-red/5 px-3 py-2 text-sm font-semibold text-pin-red">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={isLoading}
            rows={3}
            placeholder="Ví dụ: Tôi cần KOL thời trang trên TikTok, trên 100k follower, ngân sách dưới 10 triệu"
            className="min-h-[84px] flex-1 resize-none rounded-md border border-hairline bg-canvas px-4 py-3 text-sm text-ink outline-none transition-shadow placeholder:text-ash focus:border-ink focus:ring-2 focus:ring-focus-outer/40 disabled:cursor-not-allowed disabled:bg-surface-card"
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading || isAuthLoading}
            aria-disabled={!canSendChat}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-surface-card disabled:text-ash ${
              canSendChat ? 'bg-pin-red text-on-dark hover:bg-pin-red-pressed' : 'bg-surface-card text-ash hover:bg-secondary-bg'
            }`}
            aria-label="Gửi"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onQuickReply,
  disabled,
}: {
  message: Message;
  onQuickReply: (value: string) => void;
  disabled: boolean;
}) {
  const isUser = message.role === 'user';
  const showPlatformReplies =
    !isUser &&
    message.clarificationQuestions?.some((question) =>
      question.toLowerCase().includes('nền tảng') || question.toLowerCase().includes('platform'),
    );

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-on-dark">
          <Bot className="h-4 w-4" />
        </span>
      )}
      <div className={`max-w-[86%] ${isUser ? 'order-first text-right' : ''}`}>
        <div
          className={`rounded-md px-4 py-3 text-sm leading-6 ${
            isUser ? 'bg-pin-red text-on-dark' : 'bg-surface-card text-ink'
          }`}
        >
          {message.content}
        </div>
        {!isUser && !!message.clarificationQuestions?.length && (
          <div className="mt-2 rounded-md border border-hairline bg-canvas p-3 text-left">
            <p className="mb-2 text-xs font-bold uppercase text-mute">Cần làm rõ</p>
            <ul className="space-y-1.5 text-sm text-ink">
              {message.clarificationQuestions.map((question) => (
                <li key={question} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pin-red" />
                  <span>{question}</span>
                </li>
              ))}
            </ul>
            {showPlatformReplies && (
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_PLATFORM_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => onQuickReply(reply)}
                    disabled={disabled}
                    className="rounded-full bg-surface-card px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-secondary-bg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-card text-ink">
          <UserRound className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

function ResultsPanel({
  criteria,
  recommendations,
  selectedKol,
  sortKey,
  onSortChange,
  onSelectKol,
  onRetry,
  hasConversation,
}: {
  criteria: KolSearchCriteria;
  recommendations: KolRecommendationItem[];
  selectedKol: KolRecommendationItem | null;
  sortKey: SortKey;
  onSortChange: (value: SortKey) => void;
  onSelectKol: (kolId: number) => void;
  onRetry: () => void;
  hasConversation: boolean;
}) {
  return (
    <div className="flex h-full min-h-[calc(100vh-194px)] flex-col bg-surface-soft">
      <div className="border-b border-hairline-soft bg-canvas p-4 sm:p-5">
        <CriteriaSummary criteria={criteria} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-[20px] font-bold text-ink">KOL đề xuất</h2>
              <p className="text-sm text-mute">
                {recommendations.length > 0
                  ? `${recommendations.length} hồ sơ có thể so sánh`
                  : 'AI sẽ hiển thị kết quả sau khi đủ tiêu chí.'}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-2 text-sm font-bold text-ink">
              <SlidersHorizontal className="h-4 w-4" />
              <select
                value={sortKey}
                onChange={(e) => onSortChange(e.target.value as SortKey)}
                className="bg-transparent text-sm font-bold outline-none"
                aria-label="Sắp xếp KOL"
              >
                <option value="matchScore">Match score</option>
                <option value="followers">Follower</option>
                <option value="price">Giá thấp</option>
                <option value="rating">Rating</option>
              </select>
              <ChevronDown className="h-4 w-4 text-mute" />
            </label>
          </div>

          {!hasConversation ? (
            <EmptyResults
              title="Chưa có KOL đề xuất"
              body="Nhập nhu cầu tìm KOL ở tab Chat để AI phân tích tiêu chí và trả về danh sách phù hợp."
            />
          ) : recommendations.length === 0 ? (
            <EmptyResults
              title="Chưa có KOL phù hợp"
              body="Nếu AI đã hỏi thêm, hãy bổ sung nền tảng, ngân sách hoặc follower. Nếu cần, hãy thử mở rộng tiêu chí tìm kiếm."
              actionLabel="Gửi lại yêu cầu"
              onAction={onRetry}
            />
          ) : (
            <div className="space-y-3">
              {recommendations.map((kol) => (
                <RecommendationCard
                  key={kol.kolId}
                  kol={kol}
                  selected={selectedKol?.kolId === kol.kolId}
                  onSelect={() => onSelectKol(kol.kolId)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="border-t border-hairline-soft bg-canvas p-4 sm:p-5 xl:border-l xl:border-t-0">
          <SelectedKolDetail kol={selectedKol} />
        </aside>
      </div>
    </div>
  );
}

function CriteriaSummary({ criteria }: { criteria: KolSearchCriteria }) {
  const rows = [
    { label: 'Ngành hàng', value: criteria.category },
    { label: 'Nền tảng', value: criteria.platforms.length ? criteria.platforms.join(', ') : null, highlight: !criteria.platforms.length },
    { label: 'Follower tối thiểu', value: formatNumber(criteria.minFollowers) },
    { label: 'Follower tối đa', value: formatNumber(criteria.maxFollowers) },
    { label: 'Ngân sách tối thiểu', value: formatCurrency(criteria.minBudget) },
    { label: 'Ngân sách tối đa', value: formatCurrency(criteria.maxBudget) },
    { label: 'Khu vực', value: criteria.location },
    { label: 'Giới tính', value: criteria.gender },
    { label: 'Mục tiêu', value: criteria.campaignGoal },
    { label: 'Dịch vụ', value: criteria.serviceType },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-pin-red" />
        <h2 className="font-display text-[18px] font-bold text-ink">Tiêu chí hiện tại</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`rounded-md border px-3 py-2 ${
              row.value
                ? 'border-hairline bg-surface-soft'
                : row.highlight
                  ? 'border-pin-red/35 bg-pin-red/5'
                  : 'border-hairline-soft bg-canvas'
            }`}
          >
            <p className="text-[11px] font-bold uppercase text-mute">{row.label}</p>
            <p className={`mt-1 truncate text-sm font-bold ${row.value ? 'text-ink' : 'text-ash'}`}>
              {row.value ?? 'Chưa xác định'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({
  kol,
  selected,
  onSelect,
}: {
  kol: KolRecommendationItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const primaryPlatform = kol.platforms[0];

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-md border bg-canvas p-4 text-left transition-colors ${
        selected ? 'border-ink shadow-sm' : 'border-hairline hover:border-ink'
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        <Avatar name={kol.displayName} src={kol.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-ink">{kol.displayName}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {kol.categories.slice(0, 3).map((category) => (
                  <span key={category} className="rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-bold text-ink">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-on-dark">
              {kol.matchScore}% match
            </span>
          </div>

          <div className="mt-3 grid gap-1 text-sm text-body">
            <p className="truncate">
              {primaryPlatform
                ? `${formatPlatform(primaryPlatform.platform)}: ${formatCompact(primaryPlatform.followers)} followers · ER ${formatEngagement(primaryPlatform.engagementRate)}`
                : 'Chưa có nền tảng chính'}
            </p>
            <p className="truncate">
              Giá từ: {kol.priceFrom ? formatMinPrice(kol.priceFrom) : 'Liên hệ'} · Rating {kol.rating?.toFixed(1) ?? 'Mới'} · {kol.completedBookingCount} booking
            </p>
            <p className="line-clamp-2 text-mute">Lý do: {kol.reason}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function SelectedKolDetail({ kol }: { kol: KolRecommendationItem | null }) {
  if (!kol) {
    return (
      <div className="rounded-md border border-dashed border-hairline bg-surface-soft p-5 text-sm text-mute">
        Chọn một KOL để xem chi tiết so sánh.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase text-mute">Đang chọn</p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={kol.displayName} src={kol.avatarUrl} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-ink">{kol.displayName}</h3>
            <p className="text-sm text-mute">{kol.matchScore}% match</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Follower" value={formatCompact(totalFollowers(kol))} />
        <Metric label="Rating" value={kol.rating ? kol.rating.toFixed(1) : 'Mới'} />
        <Metric label="Giá từ" value={kol.priceFrom ? formatMinPrice(kol.priceFrom) : 'Liên hệ'} />
        <Metric label="Booking" value={`${kol.completedBookingCount}`} />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase text-mute">Nền tảng</p>
        <div className="space-y-2">
          {kol.platforms.length ? (
            kol.platforms.map((platform) => <PlatformRow key={`${kol.kolId}-${platform.platform}`} platform={platform} />)
          ) : (
            <p className="text-sm text-mute">Chưa có dữ liệu nền tảng.</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase text-mute">Lý do phù hợp</p>
        <p className="rounded-md bg-surface-soft p-3 text-sm leading-6 text-body">{kol.reason}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={kolDetailHref(kol)} className="btn-pin-secondary !rounded-full">
          Xem chi tiết
        </Link>
        <button className="btn-pin-primary !rounded-full" type="button">
          Chọn KOL
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-soft p-3">
      <p className="text-[11px] font-bold uppercase text-mute">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function PlatformRow({ platform }: { platform: KolRecommendationPlatform }) {
  return (
    <div className="rounded-md border border-hairline bg-canvas p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink">{formatPlatform(platform.platform)}</p>
        <p className="text-sm font-bold text-mute">{formatCompact(platform.followers)}</p>
      </div>
      <p className="mt-1 text-sm text-mute">
        ER {formatEngagement(platform.engagementRate)}
        {platform.averageViews ? ` · ${formatCompact(platform.averageViews)} views` : ''}
      </p>
    </div>
  );
}

function EmptyResults({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-md border border-dashed border-hairline bg-canvas p-8 text-center">
      <Bot className="mb-4 h-10 w-10 text-mute" />
      <h3 className="font-display text-[20px] font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-[460px] text-sm leading-6 text-mute">{body}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-pin-secondary !rounded-full mt-5">
          <RefreshCw className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-14 w-14' : 'h-14 w-14 sm:h-16 sm:w-16';
  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-secondary-bg`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-ink text-xl font-bold text-on-dark">
          {name[0]?.toUpperCase() ?? 'K'}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  return formatMinPrice(value);
}

function formatNumber(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function formatEngagement(value?: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

function formatPlatform(value: string): string {
  const upper = value.toUpperCase();
  if (upper === 'TIKTOK') return 'TikTok';
  if (upper === 'YOUTUBE') return 'YouTube';
  if (upper === 'INSTAGRAM') return 'Instagram';
  if (upper === 'FACEBOOK') return 'Facebook';
  return value;
}

function totalFollowers(kol: KolRecommendationItem): number {
  return kol.platforms.reduce((sum, platform) => sum + (platform.followers || 0), 0);
}

function nullablePrice(value: number | null): number {
  return value ?? Number.MAX_SAFE_INTEGER;
}

function kolDetailHref(kol: KolRecommendationItem): string {
  const slug = kol.slug?.trim();
  return `/kol/${slug || kol.kolId}`;
}

function readConversationHistory(): ConversationHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeConversationHistoryItem)
      .filter((item): item is ConversationHistoryItem => item !== null);
  } catch {
    return [];
  }
}

function writeConversationHistory(items: ConversationHistoryItem[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage can fail in private mode or when quota is full.
  }
}

function normalizeConversationHistoryItem(value: unknown): ConversationHistoryItem | null {
  if (!isRecord(value) || typeof value.conversationId !== 'string' || !value.conversationId.trim()) {
    return null;
  }

  const messages = Array.isArray(value.messages)
    ? value.messages.map(normalizeMessage).filter((message): message is Message => message !== null)
    : [];
  const recommendations = Array.isArray(value.recommendations)
    ? value.recommendations
        .map(normalizeRecommendation)
        .filter((recommendation): recommendation is KolRecommendationItem => recommendation !== null)
    : [];
  const selectedKolId = typeof value.selectedKolId === 'number' ? value.selectedKolId : null;
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString();
  const title = typeof value.title === 'string' && value.title.trim()
    ? value.title.trim()
    : getConversationTitle(messages);

  return {
    conversationId: value.conversationId,
    title,
    updatedAt,
    messages,
    criteria: normalizeCriteria(value.criteria),
    recommendations,
    selectedKolId,
  };
}

function normalizeMessage(value: unknown): Message | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.content !== 'string' ||
    (value.role !== 'user' && value.role !== 'assistant')
  ) {
    return null;
  }

  const clarificationQuestions = Array.isArray(value.clarificationQuestions)
    ? value.clarificationQuestions.filter((question): question is string => typeof question === 'string')
    : undefined;

  return {
    id: value.id,
    role: value.role,
    content: value.content,
    clarificationQuestions,
  };
}

function normalizeRecommendation(value: unknown): KolRecommendationItem | null {
  if (
    !isRecord(value) ||
    typeof value.kolId !== 'number' ||
    typeof value.displayName !== 'string' ||
    typeof value.matchScore !== 'number'
  ) {
    return null;
  }

  return {
    kolId: value.kolId,
    slug: nullableString(value.slug),
    displayName: value.displayName,
    avatarUrl: nullableString(value.avatarUrl),
    categories: Array.isArray(value.categories)
      ? value.categories.filter((category): category is string => typeof category === 'string')
      : [],
    platforms: Array.isArray(value.platforms)
      ? value.platforms
          .map(normalizeRecommendationPlatform)
          .filter((platform): platform is KolRecommendationPlatform => platform !== null)
      : [],
    priceFrom: nullableNumber(value.priceFrom),
    rating: nullableNumber(value.rating),
    completedBookingCount: nullableNumber(value.completedBookingCount) ?? 0,
    matchScore: value.matchScore,
    reason: typeof value.reason === 'string' ? value.reason : '',
  };
}

function normalizeRecommendationPlatform(value: unknown): KolRecommendationPlatform | null {
  if (!isRecord(value) || typeof value.platform !== 'string') return null;

  return {
    platform: value.platform,
    profileUrl: nullableString(value.profileUrl),
    followers: nullableNumber(value.followers) ?? 0,
    engagementRate: nullableNumber(value.engagementRate),
    averageViews: nullableNumber(value.averageViews),
  };
}

function normalizeCriteria(value: unknown): KolSearchCriteria {
  if (!isRecord(value)) return EMPTY_CRITERIA;

  return {
    category: nullableString(value.category),
    platforms: Array.isArray(value.platforms)
      ? value.platforms.filter((platform): platform is string => typeof platform === 'string')
      : [],
    minFollowers: nullableNumber(value.minFollowers),
    maxFollowers: nullableNumber(value.maxFollowers),
    minBudget: nullableNumber(value.minBudget),
    maxBudget: nullableNumber(value.maxBudget),
    location: nullableString(value.location),
    gender: nullableString(value.gender),
    campaignGoal: nullableString(value.campaignGoal),
    serviceType: nullableString(value.serviceType),
  };
}

function getConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content.trim();
  if (!firstUserMessage) return 'Cuộc trò chuyện AI';
  return firstUserMessage.length > 72 ? `${firstUserMessage.slice(0, 69)}...` : firstUserMessage;
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa rõ thời gian';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
