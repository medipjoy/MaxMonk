const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude expo-sqlite from web builds to avoid WASM bundling issues
const originalResolverGetModuleSourceSet = config.resolver.getModuleSourceSet;
config.resolver.getModuleSourceSet = (moduleName) => {
  if (moduleName === 'expo-sqlite' && process.env.EXPO_OS === 'web') {
    return new Set();
  }
  return originalResolverGetModuleSourceSet(moduleName);
};

module.exports = config;
