/**
 * @format
 */

import 'react-native-url-polyfill/auto';
import 'text-encoding';
import { TextEncoder, TextDecoder } from 'text-encoding';
const g = typeof globalThis !== 'undefined' ? globalThis : {};
if (typeof g.TextEncoder === 'undefined') {
  g.TextEncoder = TextEncoder;
}
if (typeof g.TextDecoder === 'undefined') {
  g.TextDecoder = TextDecoder;
}


import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

