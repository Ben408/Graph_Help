/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    if (process.env.VERCEL) return [];
    return [
      {
        source: "/engine-api/:path*",
        destination: "http://127.0.0.1:8765/:path*",
      },
    ];
  },
};

export default nextConfig;
