/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the ftml wasm binary is bundled into serverless functions that
  // render wikitext on the server (render-on-save).
  outputFileTracingIncludes: {
    '/**': ['./src/lib/ftml/ftml_bg.wasm'],
  },
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    return config;
  },
};

export default nextConfig;
