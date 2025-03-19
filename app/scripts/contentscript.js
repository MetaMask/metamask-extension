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

    if (document.prerendering && getIsBrowserPrerenderBroken()) {
      document.addEventListener('prerenderingchange', () => {
        onDisconnectDestroyStreams(
          new Error('Prerendered page has become active.'),
        );
      });
    }

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.warn('BFCached page has become active. Restoring the streams.');
        setupExtensionStreams();
      }
    });

    window.addEventListener('pagehide', (event) => {
      if (event.persisted) {
        console.warn('Page may become BFCached. Destroying the streams.');
        destroyStreams();
      }
    });
  }
};

start();
