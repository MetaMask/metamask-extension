// polyfills
import '@formatjs/intl-relativetimeformat/polyfill';

// dev only, "react-devtools" import is skipped in prod builds
import 'react-devtools';

import PortStream from 'extension-port-stream';
import browser from 'webextension-polyfill';

import Eth from 'ethjs';
import EthQuery from 'eth-query';
import StreamProvider from 'web3-stream-provider';
import log from 'loglevel';
import launchMetaMaskUi, { updateBackgroundConnection } from '../../ui';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../shared/constants/app';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { SUPPORT_LINK } from '../../ui/helpers/constants/common';
import { getErrorHtml } from '../../ui/helpers/utils/error-utils';
import ExtensionPlatform from './platforms/extension';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType } from './lib/util';
import metaRPCClientFactory from './lib/metaRPCClientFactory';

const container = document.getElementById('app-content');

const WORKER_KEEP_ALIVE_INTERVAL = 1000;
const WORKER_KEEP_ALIVE_MESSAGE = 'WORKER_KEEP_ALIVE_MESSAGE';

/*
 * As long as UI is open it will keep sending messages to service worker
 * In service worker as this message is received
 * if service worker is inactive it is reactivated and script re-loaded
 * Time has been kept to 1000ms but can be reduced for even faster re-activation of service worker
 */
if (isManifestV3) {
  setInterval(() => {
    browser.runtime.sendMessage({ name: WORKER_KEEP_ALIVE_MESSAGE });
  }, WORKER_KEEP_ALIVE_INTERVAL);
}

start().catch(log.error);

async function start() {
  // create platform global
  global.platform = new ExtensionPlatform();

  // identify window type (popup, notification)
  const windowType = getEnvironmentType();

  let isUIInitialised = false;

  // setup stream to background
  let extensionPort = browser.runtime.connect({ name: windowType });
  let connectionStream = new PortStream(extensionPort);

  const activeTab = await queryCurrentActiveTab(windowType);

  /**
   * In case of MV3 the issue of blank screen was very frequent, it is caused by UI initialising before background is ready to send state.
   * Code below ensures that UI is rendered only after background is ready.
   */
  if (isManifestV3) {
    /*
     * In case of MV3 the issue of blank screen was very frequent, it is caused by UI initialising before background is ready to send state.
     * Code below ensures that UI is rendered only after CONNECTION_READY message is received thus background is ready.
     * In case the UI is already rendered, only update the streams.
     */
    const messageListener = (message) => {
      if (message?.name === 'CONNECTION_READY') {
        if (isUIInitialised) {
          updateUiStreams();
        } else {
          initializeUiWithTab(activeTab);
        }
      }
    };

    // resetExtensionStreamAndListeners takes care to remove listeners from closed streams
    // it also creates new streams and attach event listeners to them
    const resetExtensionStreamAndListeners = () => {
      extensionPort.onMessage.removeListener(messageListener);
      extensionPort.onDisconnect.removeListener(
        resetExtensionStreamAndListeners,
      );
      // message below will try to activate service worker
      // in MV3 is likely that reason of stream closing is service worker going in-active
      browser.runtime.sendMessage({ name: WORKER_KEEP_ALIVE_MESSAGE });

      extensionPort = browser.runtime.connect({ name: windowType });
      connectionStream = new PortStream(extensionPort);
      extensionPort.onMessage.addListener(messageListener);
      extensionPort.onDisconnect.addListener(resetExtensionStreamAndListeners);
    };

    extensionPort.onMessage.addListener(messageListener);
    extensionPort.onDisconnect.addListener(resetExtensionStreamAndListeners);
  } else {
    initializeUiWithTab(activeTab);
  }

  function initializeUiWithTab(tab) {
    initializeUi(tab, connectionStream, (err, store) => {
      if (err) {
        // if there's an error, store will be = metamaskState
        displayCriticalError(err, store);
        return;
      }
      isUIInitialised = true;

      const state = store.getState();
      const { metamask: { completedOnboarding } = {} } = state;

      if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
        global.platform.openExtensionInBrowser();
      }
    });
  }

  // Function to update new backgroundConnection in the UI
  function updateUiStreams() {
    connectToAccountManager(connectionStream, (err, backgroundConnection) => {
      if (err) {
        displayCriticalError(err);
        return;
      }

      updateBackgroundConnection(backgroundConnection);
    });
  }
}

async function queryCurrentActiveTab(windowType) {
  return new Promise((resolve) => {
    // At the time of writing we only have the `activeTab` permission which means
    // that this query will only succeed in the popup context (i.e. after a "browserAction")
    if (windowType !== ENVIRONMENT_TYPE_POPUP) {
      resolve({});
      return;
    }

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const [activeTab] = tabs;
      const { id, title, url } = activeTab;
      const { origin, protocol } = url ? new URL(url) : {};

      if (!origin || origin === 'null') {
        resolve({});
        return;
      }

      resolve({ id, title, origin, protocol, url });
    });
  });
}

function initializeUi(activeTab, connectionStream, cb) {
  connectToAccountManager(connectionStream, (err, backgroundConnection) => {
    if (err) {
      cb(err, null);
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

async function displayCriticalError(err, metamaskState) {
  const html = await getErrorHtml(SUPPORT_LINK, metamaskState);

  container.innerHTML = html;

  const button = document.getElementById('critical-error-button');

  button.addEventListener('click', (_) => {
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
