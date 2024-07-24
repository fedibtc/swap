import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/app/api': ['./node_modules/tiny-secp256k1/**/*'],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    config.resolve.alias['tiny-secp256k1'] = path.resolve(
      __dirname,
      'node_modules/tiny-secp256k1'
    );
    return config;
  },
};

export default nextConfig;
