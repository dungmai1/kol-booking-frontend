import { api } from './client';
import type { CategoryResponse } from './types';

export const categoriesApi = {
  getAll(): Promise<CategoryResponse[]> {
    return api.get('/categories');
  },
};
