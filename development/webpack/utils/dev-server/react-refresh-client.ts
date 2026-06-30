import { UI_HOT_UPDATE_MESSAGE_TYPE } from './reload-protocol';

declare const require: (moduleName: string) => unknown;

type HotEmitter = {
  emit: (eventName: 'webpackHotUpdate', hash: string) => void;
};

type HotUpdateMessage = {
  type: typeof UI_HOT_UPDATE_MESSAGE_TYPE;
  hash: string;
};

const hotEmitter = require('webpack/hot/emitter') as HotEmitter;
require('webpack/hot/dev-server');

self.addEventListener('message', (event) => {
  if (event.source !== self) {
    return;
  }
  const data = event.data as Partial<HotUpdateMessage>;
  if (
    data?.type === UI_HOT_UPDATE_MESSAGE_TYPE &&
    typeof data.hash === 'string'
  ) {
    hotEmitter.emit('webpackHotUpdate', data.hash);
  }
});
