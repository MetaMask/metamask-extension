import webpackHotEmitter from 'webpack/hot/emitter';
import 'webpack/hot/dev-server';
import { UI_HOT_UPDATE_MESSAGE_TYPE } from './reload-protocol';

globalThis.addEventListener('message', (event) => {
  if (event.source !== globalThis.window) {
    return;
  }
  if (
    event.data?.type === UI_HOT_UPDATE_MESSAGE_TYPE &&
    typeof event.data.hash === 'string'
  ) {
    webpackHotEmitter.emit('webpackHotUpdate', event.data.hash);
  }
});
