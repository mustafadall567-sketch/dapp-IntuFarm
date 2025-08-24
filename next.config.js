/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
    NEXT_PUBLIC_STABLE_USD_ADDRESS: process.env.NEXT_PUBLIC_STABLE_USD_ADDRESS,
    NEXT_PUBLIC_REWARD_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS,
    NEXT_PUBLIC_FARMING_VAULT_ADDRESS: process.env.NEXT_PUBLIC_FARMING_VAULT_ADDRESS,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_ADMIN_ADDRESS: process.env.NEXT_PUBLIC_ADMIN_ADDRESS,
  },
  
  // Webpack configuration for better Web3 compatibility
  webpack: (config, { isServer }) => {
    // Fallbacks for node modules in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Handle ES modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Ignore source maps warnings for node_modules
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /node_modules/ },
    ];
    
    return config;
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https: wss:",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  
  // Image optimization configuration
  images: {
    domains: [],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compression
  compress: true,
  
  // Build optimization
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Redirects for better UX
  async redirects() {
    return [];
  },
  
  // Rewrites for API routing
  async rewrites() {
    return [];
  },
  
  // Power optimization
  poweredByHeader: false,
  
  // Trailing slash handling
  trailingSlash: false,
  
  // Generate build ID
  generateBuildId: async () => {
    // You can use git commit hash or timestamp
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
