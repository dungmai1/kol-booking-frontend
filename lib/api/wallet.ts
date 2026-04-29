import { api } from './client';
import type { WalletResponse, WalletTransactionResponse, PageResponse } from './types';

export const walletApi = {
  getMyWallet(): Promise<WalletResponse> {
    return api.get('/wallet/me');
  },

  getTransactions(page = 0, size = 20): Promise<PageResponse<WalletTransactionResponse>> {
    return api.get(`/wallet/me/transactions?page=${page}&size=${size}`);
  },
};
