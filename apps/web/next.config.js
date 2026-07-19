/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false, 'pino-pretty': false };
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(pino-pretty|@react-native-async-storage\/async-storage|@x402\/.*)$/,
      })
    );
    return config;
  },
};

module.exports = nextConfig;
