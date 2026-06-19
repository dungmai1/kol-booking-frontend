/** Extract TikTok video id from common URL shapes. */
export function extractTikTokVideoId(url: string): string | null {
  const trimmed = url.trim();
  const match =
    trimmed.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i) ??
    trimmed.match(/tiktok\.com\/.*\/video\/(\d+)/i);
  return match?.[1] ?? null;
}

export function getTikTokEmbedUrl(url: string): string | null {
  const id = extractTikTokVideoId(url);
  return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
}

export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url.trim());
}

export function isDirectImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url.trim());
}

export function isPreviewableDeliverableUrl(url: string): boolean {
  const trimmed = url.trim();
  return (
    isDirectImageUrl(trimmed) ||
    isDirectVideoUrl(trimmed) ||
    isTikTokUrl(trimmed)
  );
}

export function isTikTokUrl(url: string): boolean {
  return /tiktok\.com/i.test(url.trim());
}
