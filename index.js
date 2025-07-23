/**
 * @format
 */
import {Buffer} from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding';

import {AppRegistry, StatusBar} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Mock event listener functions to prevent them from fataling.
window.addEventListener = () => {};
window.removeEventListener = () => {};
window.Buffer = Buffer;

// Add TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding').TextDecoder;
}

// Set status bar to black
StatusBar.setBarStyle('light-content', true);
StatusBar.setBackgroundColor('#000000', true);

AppRegistry.registerComponent(appName, () => App);
