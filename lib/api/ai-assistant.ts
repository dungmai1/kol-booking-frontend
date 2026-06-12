import { api } from './client';

export interface KolSearchCriteria {
  category: string | null;
  platforms: string[];
  minFollowers: number | null;
  maxFollowers: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  location: string | null;
  gender: string | null;
  campaignGoal: string | null;
  serviceType: string | null;
}

export interface KolRecommendationPlatform {
  platform: string;
  profileUrl?: string | null;
  followers: number;
  engagementRate?: number | null;
  averageViews?: number | null;
}

export interface KolRecommendationItem {
  kolId: number;
  displayName: string;
  avatarUrl?: string | null;
  categories: string[];
  platforms: KolRecommendationPlatform[];
  priceFrom: number | null;
  rating: number | null;
  completedBookingCount: number;
  matchScore: number;
  reason: string;
  slug?: string | null;
}

export interface AiChatRequest {
  conversationId: string | null;
  message: string;
}

export interface AiChatResponse {
  conversationId: string;
  reply: string;
  intent: string;
  criteria: KolSearchCriteria;
  recommendations: KolRecommendationItem[];
  needClarification: boolean;
  clarificationQuestions: string[];
}

export interface AiHealthResponse {
  status: string;
  service: string;
}

export const aiAssistantApi = {
  health(): Promise<AiHealthResponse> {
    return api.get<AiHealthResponse>('/ai-assistant/health');
  },

  chat(data: AiChatRequest): Promise<AiChatResponse> {
    return api.post<AiChatResponse>('/ai-assistant/chat', data);
  },
};
