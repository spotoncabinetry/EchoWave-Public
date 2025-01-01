/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    bodyParser: {
      sizeLimit: '10mb' // Increase the body parser size limit
    },
    responseLimit: '10mb' // Increase the response size limit
  },
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')].filter(Boolean),
  }
}

export default nextConfig;
