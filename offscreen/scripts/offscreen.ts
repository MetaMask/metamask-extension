import { BrowserRuntimePostMessageStream } from '@metamask/post-message-stream';

/**
 * Initialize a post message stream with the parent window that is initialized
 * in the metamask-controller (background/serivce worker) process. This will be
 * utilized by snaps for communication with snaps running in the offscreen
 * document.
 */
const parentStream = new BrowserRuntimePostMessageStream({
  name: 'child',
  target: 'parent',
});

/**
 * Temporary logging to ensure that the stream is working as expected.
 */
parentStream.on('data', (data) => {
  console.log('Offscreen Document received data from service worker', data);
});
