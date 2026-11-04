/** @type {import('next').NextConfig} */
const nextConfig = {
  // The prototype is a static site: no API routes, no server runtime required.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
