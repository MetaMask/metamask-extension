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
import ExtensionPlatform from './platforms/extension';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType } from './lib/util';
import metaRPCClientFactory from './lib/metaRPCClientFactory';

start().catch(log.error);

let isUIInitialised = false;
setInterval(() => {
  browser.runtime.sendMessage({ name: 'UI_OPEN' });
}, 1000);

async function start() {
  // create platform global
  global.platform = new ExtensionPlatform();

  // identify window type (popup, notification)
  const windowType = getEnvironmentType();

  // setup stream to background
  let extensionPort = browser.runtime.connect({ name: windowType });
  let connectionStream = new PortStream(extensionPort);

  const activeTab = await queryCurrentActiveTab(windowType);

  const messageListener = (message) => {
    if (message?.name === 'CONNECTION_READY') {
      initializeUiWithTab(activeTab);
    }
  };
  const disconnectListener = () => {
    extensionPort.onMessage.removeListener(messageListener);
    extensionPort.onDisconnect.removeListener(disconnectListener);
  };

  if (process.env.ENABLE_MV3) {
    extensionPort.onMessage.addListener(messageListener);
    extensionPort.onDisconnect.addListener(disconnectListener);
  } else {
    initializeUiWithTab(activeTab);
  }

  function displayCriticalError(container, err) {
    container.innerHTML =
      '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>';
    container.style.height = '80px';
    log.error(err.stack);
    throw err;
  }

  browser.runtime.onMessage.addListener((message) => {
    // todo: change check below to do app init whenever port is closed
    if (message.name === 'APP_INIT') {
      extensionPort = browser.runtime.connect({ name: windowType });
      connectionStream = new PortStream(extensionPort);
      extensionPort.onMessage.addListener(messageListener);
      extensionPort.onDisconnect.addListener(disconnectListener);
    }
    return true;
  });

  function initializeUiWithTab(tab) {
    const container = document.getElementById('app-content');
    if (isUIInitialised) {
      updateUiStreams(container);
    } else {
      initializeUi(tab, container, connectionStream, (err, appStore) => {
        if (!err) {
          isUIInitialised = true;
        }
        if (err) {
          displayCriticalError(container, err);
          return;
        }
        const state = appStore.getState();
        const { metamask: { completedOnboarding } = {} } = state;

        if (
          !completedOnboarding &&
          windowType !== ENVIRONMENT_TYPE_FULLSCREEN
        ) {
          global.platform.openExtensionInBrowser();
        }
      });
    }
  }

  // todo: check if needed
  function updateUiStreams(container) {
    connectToAccountManager(connectionStream, (err, backgroundConnection) => {
      if (err) {
        displayCriticalError(container, err);
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

function initializeUi(activeTab, container, connectionStream, cb) {
  connectToAccountManager(connectionStream, (err, backgroundConnection) => {
    if (err) {
      cb(err);
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

/**
 * Establishes a connection to the background and a Web3 provider
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when controller connection is established
 */
function connectToAccountManager(connectionStream, cb) {
  const mx = setupMultiplex(connectionStream);
  setupControllerConnection(mx.createStream('controller'), cb);
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
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when the remote account manager connection is established
 */
function setupControllerConnection(connectionStream, cb) {
  const backgroundRPC = metaRPCClientFactory(connectionStream);
  cb(null, backgroundRPC);
}
