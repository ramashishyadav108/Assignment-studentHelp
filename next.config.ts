import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ESLint during builds to prevent failures from library-generated files
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure webpack to handle canvas and other external packages used by pdf-lib
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize packages that should not be bundled on the server
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
        // Externalize pdfjs-dist to prevent DOMMatrix errors during SSR
        'pdfjs-dist': 'commonjs pdfjs-dist',
        'pdfjs-dist/legacy/build/pdf': 'commonjs pdfjs-dist/legacy/build/pdf',
      });
    }

    // Ignore node-specific modules when bundling for the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false,
    };

    return config;
  },
};

export default nextConfig;
