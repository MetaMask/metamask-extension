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

const start = (): void => {
  if (isDetectedPhishingSite) {
    initPhishingStreams();
    return;
  }

  if (isDetectedCookieMarketingSite) {
    initializeCookieHandlerSteam();
  }

  if (shouldInjectProvider()) {
    initStreams();

    const doc = document as Document & { prerendering?: boolean };
    if (doc.prerendering && getIsBrowserPrerenderBroken()) {
      document.addEventListener('prerenderingchange', () => {
        onDisconnectDestroyStreams(
          new Error('Prerendered page has become active.'),
        );
      });
    }

    window.addEventListener('pageshow', (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Use proper logging instead of console.warn
        // eslint-disable-next-line no-console
        console.warn('BFCached page has become active. Restoring the streams.');
        setupExtensionStreams();
      }
    });

    window.addEventListener('pagehide', (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Use proper logging instead of console.warn
        // eslint-disable-next-line no-console
        console.warn('Page may become BFCached. Destroying the streams.');
        destroyStreams();
      }
    });
  }
};

start();

