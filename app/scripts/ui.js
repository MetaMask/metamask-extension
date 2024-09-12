// Disabled to allow setting up initial state hooks first

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
import './lib/setup-initial-state-hooks';
import '../../development/wdyr';

// dev only, "react-devtools" import is skipped in prod builds
import 'react-devtools';

import PortStream from 'extension-port-stream';
import browser from 'webextension-polyfill';

import Eth from '@metamask/ethjs';
import EthQuery from '@metamask/eth-query';
import StreamProvider from 'web3-stream-provider';
import log from 'loglevel';
import launchMetaMaskUi, { updateBackgroundConnection } from '../../ui';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_FIREFOX,
} from '../../shared/constants/app';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { checkForLastErrorAndLog } from '../../shared/modules/browser-runtime.utils';
import { SUPPORT_LINK } from '../../shared/lib/ui-utils';
import { getErrorHtml } from '../../shared/lib/error-utils';
import { endTrace, trace, TraceName } from '../../shared/lib/trace';
import ExtensionPlatform from './platforms/extension';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType, getPlatform } from './lib/util';
import metaRPCClientFactory from './lib/metaRPCClientFactory';

const PHISHING_WARNING_PAGE_TIMEOUT = 1 * 1000; // 1 Second
const PHISHING_WARNING_SW_STORAGE_KEY = 'phishing-warning-sw-registered';
const METHOD_START_UI_SYNC = 'startUISync';

const container = document.getElementById('app-content');

let extensionPort;
let isUIInitialised = false;

/**
 * An error thrown if the phishing warning page takes too long to load.
 */
class PhishingWarningPageTimeoutError extends Error {
  constructor() {
    super('Timeout failed');
  }
}

start().catch(log.error);

async function start() {
  const startTime = performance.now();

  const traceContext = trace({
    name: TraceName.UIStartup,
    startTime: performance.timeOrigin,
  });

  trace({
    name: TraceName.LoadScripts,
    startTime: performance.timeOrigin,
    parentContext: traceContext,
  });

  endTrace({
    name: TraceName.LoadScripts,
    timestamp: performance.timeOrigin + startTime,
  });

  // create platform global
  global.platform = new ExtensionPlatform();

  // identify window type (popup, notification)
  const windowType = getEnvironmentType();

  // setup stream to background
  extensionPort = browser.runtime.connect({ name: windowType });

  let connectionStream = new PortStream(extensionPort);

  const activeTab = await queryCurrentActiveTab(windowType);

  /*
   * In case of MV3 the issue of blank screen was very frequent, it is caused by UI initialising before background is ready to send state.
   * Code below ensures that UI is rendered only after "CONNECTION_READY" or "startUISync"
   * messages are received thus the background is ready, and ensures that streams and
   * phishing warning page load only after the "startUISync" message is received.
   * In case the UI is already rendered, only update the streams.
   */
  const messageListener = async (message) => {
    const method = message?.data?.method;

    if (method !== METHOD_START_UI_SYNC) {
      return;
    }

    endTrace({ name: TraceName.BackgroundConnect });

    if (isManifestV3 && isUIInitialised) {
      // Currently when service worker is revived we create new streams
      // in later version we might try to improve it by reviving same streams.
      updateUiStreams();
    } else {
      await initializeUiWithTab(
        activeTab,
        connectionStream,
        windowType,
        traceContext,
      );
    }

    if (isManifestV3) {
      await loadPhishingWarningPage();
    } else {
      extensionPort.onMessage.removeListener(messageListener);
    }
  };

  if (isManifestV3) {
    // resetExtensionStreamAndListeners takes care to remove listeners from closed streams
    // it also creates new streams and attaches event listeners to them
    const resetExtensionStreamAndListeners = () => {
      extensionPort.onMessage.removeListener(messageListener);
      extensionPort.onDisconnect.removeListener(
        resetExtensionStreamAndListeners,
      );

      extensionPort = browser.runtime.connect({ name: windowType });
      connectionStream = new PortStream(extensionPort);
      extensionPort.onMessage.addListener(messageListener);
      extensionPort.onDisconnect.addListener(resetExtensionStreamAndListeners);
    };

    extensionPort.onDisconnect.addListener(resetExtensionStreamAndListeners);
  }

  trace({
    name: TraceName.BackgroundConnect,
    parentContext: traceContext,
  });

  extensionPort.onMessage.addListener(messageListener);
}

/**
 * Load the phishing warning page temporarily to ensure the service
 * worker has been registered, so that the warning page works offline.
 */
async function loadPhishingWarningPage() {
  // Check session storage for whether we've already initialized the phishing warning
  // service worker in this browser session and do not attempt to re-initialize if so.
  const phishingSWMemoryFetch = await browser.storage.session.get(
    PHISHING_WARNING_SW_STORAGE_KEY,
  );

  if (phishingSWMemoryFetch[PHISHING_WARNING_SW_STORAGE_KEY]) {
    return;
  }

  const currentPlatform = getPlatform();
  let iframe;

  try {
    const extensionStartupPhishingPageUrl = new URL(
      process.env.PHISHING_WARNING_PAGE_URL,
    );
    // The `extensionStartup` hash signals to the phishing warning page that it should not bother
    // setting up streams for user interaction. Otherwise this page load would cause a console
    // error.
    extensionStartupPhishingPageUrl.hash = '#extensionStartup';

    iframe = window.document.createElement('iframe');
    iframe.setAttribute('src', extensionStartupPhishingPageUrl.href);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    // Create "deferred Promise" to allow passing resolve/reject to event handlers
    let deferredResolve;
    let deferredReject;
    const loadComplete = new Promise((resolve, reject) => {
      deferredResolve = resolve;
      deferredReject = reject;
    });

    // The load event is emitted once loading has completed, even if the loading failed.
    // If loading failed we can't do anything about it, so we don't need to check.
    iframe.addEventListener('load', deferredResolve);

    // This step initiates the page loading.
    window.document.body.appendChild(iframe);

    // This timeout ensures that this iframe gets cleaned up in a reasonable
    // timeframe, and ensures that the "initialization complete" message
    // doesn't get delayed too long.
    setTimeout(
      () => deferredReject(new PhishingWarningPageTimeoutError()),
      PHISHING_WARNING_PAGE_TIMEOUT,
    );

    await loadComplete;

    // store a flag in sessions storage that we've already loaded the service worker
    // and don't need to try again
    if (currentPlatform === PLATFORM_FIREFOX) {
      // Firefox does not yet support the storage.session API introduced in MV3
      // Tracked here: https://bugzilla.mozilla.org/show_bug.cgi?id=1687778
      console.error(
        'Firefox does not support required MV3 APIs: Phishing warning page iframe and service worker will reload each page refresh',
      );
    } else {
      browser.storage.session.set({
        [PHISHING_WARNING_SW_STORAGE_KEY]: true,
      });
    }
  } catch (error) {
    if (error instanceof PhishingWarningPageTimeoutError) {
      console.warn(
        'Phishing warning page timeout; page not guaranteed to work offline.',
      );
    } else {
      console.error('Failed to initialize phishing warning page', error);
    }
  } finally {
    if (iframe) {
      iframe.remove();
    }
  }
}

async function initializeUiWithTab(
  tab,
  connectionStream,
  windowType,
  traceContext,
) {
  try {
    const store = await initializeUi(tab, connectionStream, traceContext);

    endTrace({ name: TraceName.UIStartup });

    isUIInitialised = true;

    if (process.env.IN_TEST) {
      window.document?.documentElement?.classList.add('controller-loaded');
    }

    const state = store.getState();
    const { metamask: { completedOnboarding } = {} } = state;

    if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
      global.platform.openExtensionInBrowser();
    }
  } catch (err) {
    displayCriticalError('troubleStarting', err);
  }
}

// Function to update new backgroundConnection in the UI
function updateUiStreams(connectionStream) {
  const backgroundConnection = connectToAccountManager(connectionStream);
  updateBackgroundConnection(backgroundConnection);
}

async function queryCurrentActiveTab(windowType) {
  // Shims the activeTab for E2E test runs only if the
  // "activeTabOrigin" querystring key=value is set
  if (process.env.IN_TEST) {
    const searchParams = new URLSearchParams(window.location.search);
    const mockUrl = searchParams.get('activeTabOrigin');
    if (mockUrl) {
      const { origin, protocol } = new URL(mockUrl);
      const returnUrl = {
        id: 'mock-site',
        title: 'Mock Site',
        url: mockUrl,
        origin,
        protocol,
      };
      return returnUrl;
    }
  }

  // At the time of writing we only have the `activeTab` permission which means
  // that this query will only succeed in the popup context (i.e. after a "browserAction")
  if (windowType !== ENVIRONMENT_TYPE_POPUP) {
    return {};
  }

  const tabs = await browser.tabs
    .query({ active: true, currentWindow: true })
    .catch((e) => {
      checkForLastErrorAndLog() || log.error(e);
    });

  const [activeTab] = tabs;
  const { id, title, url } = activeTab;
  const { origin, protocol } = url ? new URL(url) : {};

  if (!origin || origin === 'null') {
    return {};
  }

  return { id, title, origin, protocol, url };
}

async function initializeUi(activeTab, connectionStream, traceContext) {
  const backgroundConnection = connectToAccountManager(connectionStream);

  return await launchMetaMaskUi({
    activeTab,
    container,
    backgroundConnection,
    traceContext,
  });
}

async function displayCriticalError(errorKey, err, metamaskState) {
  const html = await getErrorHtml(errorKey, SUPPORT_LINK, metamaskState);

  container.innerHTML = html;

  const button = document.getElementById('critical-error-button');

  button?.addEventListener('click', (_) => {
    browser.runtime.reload();
  });

  log.error(err.stack);
  throw err;
}

/**
 * Establishes a connection to the background and a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 */
function connectToAccountManager(connectionStream) {
  const mx = setupMultiplex(connectionStream);
  const controllerConnectionStream = mx.createStream('controller');

  const backgroundConnection = setupControllerConnection(
    controllerConnectionStream,
  );

  setupWeb3Connection(mx.createStream('provider'));

  return backgroundConnection;
}

/**
 * Establishes a streamed connection to a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 */
function setupWeb3Connection(connectionStream) {
  const providerStream = new StreamProvider();
  providerStream.pipe(connectionStream).pipe(providerStream);
  connectionStream.on('error', console.error.bind(console));
  providerStream.on('error', console.error.bind(console));
  global.ethereumProvider = providerStream;
  global.ethQuery = new EthQuery(providerStream);
  global.eth = new Eth(providerStream);
}

/**
 * Establishes a streamed connection to the background account manager
 *
 * @param {PortDuplexStream} controllerConnectionStream - PortStream instance establishing a background connection
 */
function setupControllerConnection(controllerConnectionStream) {
  return metaRPCClientFactory(controllerConnectionStream);
}
