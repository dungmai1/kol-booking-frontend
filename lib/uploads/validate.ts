export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const ACCEPTED_VIDEO_TYPES = ['video/mp4'] as const;

export const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(',');
export const ACCEPTED_VIDEO_ACCEPT = ACCEPTED_VIDEO_TYPES.join(',');

export type UploadKind = 'image' | 'video';

function formatMB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function validateUploadFile(file: File, kind: UploadKind): string | null {
  if (!file || file.size === 0) {
    return 'Tệp rỗng hoặc không hợp lệ.';
  }

  if (kind === 'image') {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      return 'Chỉ chấp nhận ảnh JPEG, PNG, GIF hoặc WEBP.';
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `Ảnh vượt quá dung lượng tối đa ${formatMB(MAX_IMAGE_BYTES)}.`;
    }
    return null;
  }

  if (!ACCEPTED_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_TYPES)[number])) {
    return 'Chỉ chấp nhận video MP4.';
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `Video vượt quá dung lượng tối đa ${formatMB(MAX_VIDEO_BYTES)}.`;
  }
  return null;
}
