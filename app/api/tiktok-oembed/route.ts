import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !/tiktok\.com/i.test(url)) {
    return NextResponse.json({ error: 'Invalid TikTok URL' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 86_400 } },
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'oEmbed request failed' }, { status: 502 });
    }
    const data = (await res.json()) as {
      thumbnail_url?: string;
      title?: string;
      author_name?: string;
    };
    return NextResponse.json({
      thumbnail_url: data.thumbnail_url ?? null,
      title: data.title ?? null,
      author_name: data.author_name ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'oEmbed unavailable' }, { status: 502 });
  }
}
