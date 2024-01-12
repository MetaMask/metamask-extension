// Disabled to allow setting up initial state hooks first

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
import './lib/setup-initial-state-hooks';

// dev only, "react-devtools" import is skipped in prod builds
import 'react-devtools';

import PortStream from 'extension-port-stream';
import browser from 'webextension-polyfill';

import Eth from 'ethjs';
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
import {
  getErrorHtml,
  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  registerDesktopErrorActions,
  ///: END:ONLY_INCLUDE_IF
} from '../../shared/lib/error-utils';
import ExtensionPlatform from './platforms/extension';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType, getPlatform } from './lib/util';
import metaRPCClientFactory from './lib/metaRPCClientFactory';

const container = document.getElementById('app-content');

const ONE_SECOND_IN_MILLISECONDS = 1_000;

// Timeout for initializing phishing warning page.
const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

const PHISHING_WARNING_SW_STORAGE_KEY = 'phishing-warning-sw-registered';

let extensionPort;

start().catch(log.error);

async function start() {
  // create platform global
  global.platform = new ExtensionPlatform();

  // identify window type (popup, notification)
  const windowType = getEnvironmentType();

  let isUIInitialised = false;

  // setup stream to background
  extensionPort = browser.runtime.connect({ name: windowType });
  let connectionStream = new PortStream(extensionPort);

  const activeTab = await queryCurrentActiveTab(windowType);

  let loadPhishingWarningPage;

  if (isManifestV3) {
    /*
     * In case of MV3 the issue of blank screen was very frequent, it is caused by UI initialising before background is ready to send state.
     * Code below ensures that UI is rendered only after "CONNECTION_READY" or "startUISync"
     * messages are received thus the background is ready, and ensures that streams and
     * phishing warning page load only after the "startUISync" message is received.
     * In case the UI is already rendered, only update the streams.
     */
    const messageListener = async (message) => {
      if (message?.data?.method === 'startUISync') {
        if (isUIInitialised) {
          // Currently when service worker is revived we create new streams
          // in later version we might try to improve it by reviving same streams.
          updateUiStreams();
        } else {
          initializeUiWithTab(activeTab);
        }
        await loadPhishingWarningPage();
      }
    };

    /**
     * An error thrown if the phishing warning page takes too long to load.
     */
    class PhishingWarningPageTimeoutError extends Error {
      constructor() {
        super('Timeout failed');
      }
    }

    /**
     * Load the phishing warning page temporarily to ensure the service
     * worker has been registered, so that the warning page works offline.
     */
    loadPhishingWarningPage = async function () {
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
    };

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

    extensionPort.onMessage.addListener(messageListener);
    extensionPort.onDisconnect.addListener(resetExtensionStreamAndListeners);
  } else {
    const messageListener = async (message) => {
      if (message?.data?.method === 'startUISync') {
        initializeUiWithTab(activeTab);
        extensionPort.onMessage.removeListener(messageListener);
      }
    };
    extensionPort.onMessage.addListener(messageListener);
  }

  function initializeUiWithTab(tab) {
    initializeUi(
      tab,
      connectionStream,
      (
        err,
        store,
        ///: BEGIN:ONLY_INCLUDE_IF(desktop)
        backgroundConnection,
        ///: END:ONLY_INCLUDE_IF
      ) => {
        if (err) {
          // if there's an error, store will be = metamaskState
          displayCriticalError(
            'troubleStarting',
            err,
            store,
            ///: BEGIN:ONLY_INCLUDE_IF(desktop)
            backgroundConnection,
            ///: END:ONLY_INCLUDE_IF
          );
          return;
        }
        isUIInitialised = true;

        const state = store.getState();
        const { metamask: { completedOnboarding } = {} } = state;

        if (
          !completedOnboarding &&
          windowType !== ENVIRONMENT_TYPE_FULLSCREEN
        ) {
          global.platform.openExtensionInBrowser();
        }
      },
    );
  }

  // Function to update new backgroundConnection in the UI
  function updateUiStreams() {
    connectToAccountManager(connectionStream, (err, backgroundConnection) => {
      if (err) {
        displayCriticalError(
          'troubleStarting',
          err,
          ///: BEGIN:ONLY_INCLUDE_IF(desktop)
          undefined,
          backgroundConnection,
          ///: END:ONLY_INCLUDE_IF
        );
        return;
      }

      updateBackgroundConnection(backgroundConnection);
    });
  }
}

async function queryCurrentActiveTab(windowType) {
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

function initializeUi(activeTab, connectionStream, cb) {
  connectToAccountManager(connectionStream, (err, backgroundConnection) => {
    if (err) {
      cb(
        err,
        null,
        ///: BEGIN:ONLY_INCLUDE_IF(desktop)
        backgroundConnection,
        ///: END:ONLY_INCLUDE_IF
      );
      return;
    }

    launchMetaMaskUi(
      {
        activeTab,
        container,
        backgroundConnection,
      },
      cb,
    );
  });
}

async function displayCriticalError(
  errorKey,
  err,
  metamaskState,
  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  backgroundConnection,
  ///: END:ONLY_INCLUDE_IF
) {
  const html = await getErrorHtml(
    errorKey,
    SUPPORT_LINK,
    metamaskState,
    ///: BEGIN:ONLY_INCLUDE_IF(desktop)
    err,
    ///: END:ONLY_INCLUDE_IF
  );

  container.innerHTML = html;

  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  registerDesktopErrorActions(backgroundConnection, browser);
  ///: END:ONLY_INCLUDE_IF

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
 * @param {Function} cb - Called when controller connection is established
 */
function connectToAccountManager(connectionStream, cb) {
  const mx = setupMultiplex(connectionStream);
  const controllerConnectionStream = mx.createStream('controller');
  setupControllerConnection(controllerConnectionStream, cb);
  setupWeb3Connection(mx.createStream('provider'));
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
 * @param {Function} cb - Called when the remote account manager connection is established
 */
function setupControllerConnection(controllerConnectionStream, cb) {
  const backgroundRPC = metaRPCClientFactory(controllerConnectionStream);
  cb(null, backgroundRPC);
}
