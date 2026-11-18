/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // PREVIEW_EXPORT builds a static, form-less copy for design review only.
  ...(process.env.PREVIEW_EXPORT ? { output: 'export', assetPrefix: './', images: { unoptimized: true } } : {}),
};
export default nextConfig;
