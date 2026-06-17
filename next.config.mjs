/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/login', destination: '/auth/login', permanent: true },
      // Email links from backend use /api/v1/auth/* — map to frontend auth pages (query string preserved).
      {
        source: '/api/v1/auth/verify-email',
        destination: '/auth/verify-email',
        permanent: false,
      },
      {
        source: '/api/v1/auth/reset-password',
        destination: '/reset-password',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081/api/v1';
    let origin = 'http://localhost:8081';
    try {
      origin = new URL(apiUrl).origin;
    } catch {
      // keep default
    }
    return [{ source: '/uploads/:path*', destination: `${origin}/uploads/:path*` }];
  },
}

export default nextConfig
