// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('crypto-browserify'),
  url: require.resolve('url'),
};

// Handle import.meta by favoring CommonJS over ESM for specific packages
config.resolver.unstable_conditionNames = [
  'browser',
  'require',
  'react-native',
];

module.exports = config;
