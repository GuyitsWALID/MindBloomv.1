const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add font extensions to asset extensions
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

module.exports = config;