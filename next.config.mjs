/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jalwagame1.link',
        pathname: '/assets/png/**',
      },
    ],
  },
};

export default nextConfig;

