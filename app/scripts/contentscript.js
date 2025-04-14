import { getIsBrowserPrerenderBroken } from '../../shared/modules/browser-runtime.utils';
import shouldInjectProvider from '../../shared/modules/provider-injection';
import {
  destroyStreams,
  initStreams,
  onDisconnectDestroyStreams,
  setupExtensionStreams,
} from './streams/provider-stream';
import {
  isDetectedPhishingSite,
  initPhishingStreams,
} from './streams/phishing-stream';
import {
  initializeCookieHandlerSteam,
  isDetectedCookieMarketingSite,
} from './streams/cookie-handler-stream';

const start = () => {
  if (isDetectedPhishingSite) {
    initPhishingStreams();
    return;
  }

  if (isDetectedCookieMarketingSite) {
    initializeCookieHandlerSteam();
  }

  if (shouldInjectProvider()) {
    initStreams();

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    if (document.prerendering && getIsBrowserPrerenderBroken()) {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      document.addEventListener('prerenderingchange', () => {
        onDisconnectDestroyStreams(
          new Error('Prerendered page has become active.'),
        );
      });
    }

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.warn('BFCached page has become active. Restoring the streams.');
        setupExtensionStreams();
      }
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    window.addEventListener('pagehide', (event) => {
      if (event.persisted) {
        console.warn('Page may become BFCached. Destroying the streams.');
        destroyStreams();
      }
    });
  }
};

start();
