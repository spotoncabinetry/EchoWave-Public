/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    logging: {
      level: 'verbose',
      fullUrl: true,
    },
  },
  onDemandEntries: {
    // Make sure entries are not disposed
    maxInactiveAge: 1000 * 60 * 60, // 1 hour
  },
}

export default nextConfig
