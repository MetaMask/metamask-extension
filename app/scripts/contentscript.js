import { getIsBrowserPrerenderBroken } from '../../shared/modules/browser-runtime.utils';
import shouldInjectProvider from '../../shared/modules/provider-injection';
import {
  initStreams,
  onDisconnectDestroyStreams,
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
  }
};

start();
