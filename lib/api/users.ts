import { api } from './client';
import type { MeResponse } from './types';

export interface DeleteAccountRequest {
  password: string;
}

export const usersApi = {
  deleteAccount(data: DeleteAccountRequest): Promise<void> {
    return api.delete('/users/me', data);
  },

  deactivateAccount(data: DeleteAccountRequest & { reason?: string }): Promise<MeResponse> {
    return api.patch<MeResponse>('/users/me/deactivate', data);
  },
};
