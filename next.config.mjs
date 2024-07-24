/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    return config;
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api": ["./node_modules/tiny-secp256k1/lib/*.wasm"]
    }
  }
};

export default nextConfig;
