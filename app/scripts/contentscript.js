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

(function () {
  let once = false;
  const { chrome, browser } = window;
  // TODO: "document" because LavaMoat blocks props
  // TODO: definitions against the globalThis (window)
  Object.defineProperty(document, 'INJECT_ONCE', {
    value: (textContent) => {
      if (once) {
        return;
      }
      once = true;
      const d = document;
      const s = d.createElement('script');
      s.textContent = textContent;
      s.nonce = btoa((browser || chrome).runtime.getURL('/'));
      d.documentElement.appendChild(s).remove();
    },
  });
})();

start();
