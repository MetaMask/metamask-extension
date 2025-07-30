// Disabled to allow setting up initial state hooks first

// This import sets up safe intrinsics required for LavaDome to function securely.
// It must be run before any less trusted code so that no such code can undermine it.
import '@lavamoat/lavadome-react';

// This import sets up global functions required for Sentry to function.
// It must be run as soon as possible in case an error is thrown later during initialization.
import './lib/setup-initial-state-hooks';
import '../../development/wdyr';

// dev only, "react-devtools" import is skipped in prod builds
import 'react-devtools';

import PortStream from 'extension-port-stream';
import browser from 'webextension-polyfill';

import { StreamProvider } from '@metamask/providers';
import { createIdRemapMiddleware } from '@metamask/json-rpc-engine';
import log from 'loglevel';
import launchMetaMaskUi, {
  CriticalStartupErrorHandler,
  connectToBackground,
  displayCriticalError,
  CriticalErrorTranslationKey,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../ui';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_FIREFOX,
} from '../../shared/constants/app';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { checkForLastErrorAndLog } from '../../shared/modules/browser-runtime.utils';
import { endTrace, trace, TraceName } from '../../shared/lib/trace';
import ExtensionPlatform from './platforms/extension';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType, getPlatform } from './lib/util';
import metaRPCClientFactory from './lib/metaRPCClientFactory';

const PHISHING_WARNING_PAGE_TIMEOUT = 1 * 1000; // 1 Second
const PHISHING_WARNING_SW_STORAGE_KEY = 'phishing-warning-sw-registered';

/**
 * @type {HTMLElement}
 */
const container = document.getElementById('app-content');

/**
 * @typedef {import("@metamask/object-multiplex/dist/Substream").Substream} Substream
 */

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

  // Connection state management
  /**
   * @type {browser.Runtime.Port}
   */
  let extensionPort;
  /**
   * @type {PortStream}
   */
  let connectionStream;
  /**
   * @type {ReturnType<typeof connectSubstreams>}
   */
  let subStreams;
  /**
   * @type {ReturnType<typeof metaRPCClientFactory>}
   */
  let backgroundConnection;
  /**
   * @type {CriticalStartupErrorHandler}
   */
  let criticalErrorHandler;
  let isInitialized = false;

  async function createConnections() {
    // setup stream to background
    extensionPort = browser.runtime.connect({ name: windowType });

    // Set up error handlers as early as possible to ensure we are ready to
    // handle any errors that occur at any time
    criticalErrorHandler = new CriticalStartupErrorHandler(
      extensionPort,
      container,
    );
    criticalErrorHandler.install();

    connectionStream = new PortStream(extensionPort);
    subStreams = connectSubstreams(connectionStream);
    backgroundConnection = metaRPCClientFactory(subStreams.controller);

    // Set up disconnect handler for reconnection
    // TODO: check if this is only need for MV3
    extensionPort.onDisconnect.addListener(() => {
      log.warn('Extension port disconnected, attempting to reconnect...');
      handleDisconnection();
    });

    connectToBackground(backgroundConnection, handleStartUISync);
  }

  async function handleDisconnection() {
    try {
      // Destroy existing connections
      if (criticalErrorHandler) {
        criticalErrorHandler.uninstall();
      }

      // Clear the global provider
      if (global.ethereumProvider) {
        delete global.ethereumProvider;
      }

      // Wait a bit before reconnecting to avoid rapid reconnection attempts
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Recreate all connections
      await createConnections();

      log.info('Successfully reconnected to background');
    } catch (error) {
      log.error('Failed to reconnect:', error);
      // Retry reconnection after a delay
      setTimeout(handleDisconnection, 1000);
    }
  }

  async function handleStartUISync() {
    endTrace({ name: TraceName.BackgroundConnect });

    // this means we've received a message from the background, and so
    // background startup has succeed, so we don't need to listen for error
    // messages anymore
    criticalErrorHandler.uninstall();

    // Only after startUiSync has started can we set up the provider connection
    // The provider connection *must* be set up before the UI is initialized, as
    // it sets a global variable, `ethereumProvider`, that the UI relies on.
    await setupProviderConnection(subStreams.provider);

    const activeTab = await queryCurrentActiveTab(windowType);

    // Only initialize UI once, subsequent reconnections shouldn't re-initialize the UI
    if (!isInitialized) {
      await initializeUiWithTab(
        activeTab,
        backgroundConnection,
        windowType,
        traceContext,
      );
      isInitialized = true;
    }

    if (isManifestV3) {
      await loadPhishingWarningPage();
    }
  }

  // Initial connection setup
  await createConnections();

  trace({
    name: TraceName.BackgroundConnect,
    parentContext: traceContext,
  });
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

    if (process.env.IN_TEST) {
      window.document?.documentElement?.classList.add('controller-loaded');
    }

    const state = store.getState();
    const { metamask: { completedOnboarding } = {} } = state;

    if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
      global.platform.openExtensionInBrowser();
    }
  } catch (error) {
    await displayCriticalError(
      container,
      CriticalErrorTranslationKey.TroubleStarting,
      error,
    );
  }
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

async function initializeUi(activeTab, backgroundConnection, traceContext) {
  return await launchMetaMaskUi({
    activeTab,
    container,
    backgroundConnection,
    traceContext,
  });
}

/**
 * Establishes a connections between the PortStream (background) and various UI
 * streams.
 *
 * @param {PortStream} connectionStream - PortStream instance establishing a background connection
 * @returns The multiplexed streams
 */
function connectSubstreams(connectionStream) {
  const mx = setupMultiplex(connectionStream);

  const controllerSubstream = mx.createStream('controller');
  const providerSubstream = mx.createStream('provider');

  return {
    controller: controllerSubstream,
    provider: providerSubstream,
  };
}

/**
 * Establishes a streamed connection to a Web3 provider
 *
 * @param {Substream} connectionStream - PortStream instance establishing a background connection
 */
async function setupProviderConnection(connectionStream) {
  const providerStream = new StreamProvider(connectionStream, {
    rpcMiddleware: [createIdRemapMiddleware()],
  });
  connectionStream.on('error', console.error.bind(console));
  providerStream.on('error', console.error.bind(console));

  await providerStream.initialize();
  // TODO: can we make this a getter function that we swap out at anytime?
  global.ethereumProvider = providerStream;
}
