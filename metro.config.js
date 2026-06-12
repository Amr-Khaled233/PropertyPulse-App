// Default Expo Metro config. Required so the Expo Router entry resolves the
// route directory (this project keeps its routes in src/app).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
