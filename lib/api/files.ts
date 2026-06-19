import { api } from './client';
import type { FileUploadResponse } from './types';

export const filesApi = {
  /** Upload qua backend → lưu trên server (`/uploads/...`). */
  async upload(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<FileUploadResponse>('/files/upload', formData);
  },
};
