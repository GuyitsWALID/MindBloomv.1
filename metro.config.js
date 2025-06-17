const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Add font extensions to asset extensions
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Clear cache on startup
config.resetCache = true;

module.exports = config;