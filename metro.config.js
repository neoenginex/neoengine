/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    alias: {
      crypto: 'react-native-crypto',
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
    platforms: ['ios', 'android', 'native', 'web'],
  },
};
