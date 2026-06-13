/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
    let origin = 'http://localhost:8080';
    try {
      origin = new URL(apiUrl).origin;
    } catch {
      // keep default
    }
    return [{ source: '/uploads/:path*', destination: `${origin}/uploads/:path*` }];
  },
}

export default nextConfig
