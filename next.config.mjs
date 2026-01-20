/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  // Disable static optimization for pages that need database access
  output: 'standalone'
};

export default nextConfig;
