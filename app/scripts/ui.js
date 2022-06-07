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
import launchMetaMaskUi from '../../ui';
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

start().catch(log.error);

async function start() {
  async function displayCriticalError(container, err, metamaskState) {
    const html = await getErrorHtml(SUPPORT_LINK, metamaskState);

    container.innerHTML = html;

    const button = document.getElementById('critical-error-button');

    button.addEventListener('click', (_) => {
      browser.runtime.reload();
    });

    log.error(err.stack);
    throw err;
  }

  // create platform global
  global.platform = new ExtensionPlatform();

  // identify window type (popup, notification)
  const windowType = getEnvironmentType();

  // setup stream to background
  const extensionPort = browser.runtime.connect({ name: windowType });

  const connectionStream = new PortStream(extensionPort);

  const activeTab = await queryCurrentActiveTab(windowType);

  /**
   * In case of MV3 the issue of blank screen was very frequent, it is caused by UI initialising before background is ready to send state.
   * Code below ensures that UI is rendered only after background is ready.
   */
  if (isManifestV3()) {
    extensionPort.onMessage.addListener((message) => {
      if (message?.name === 'CONNECTION_READY') {
        initializeUiWithTab(activeTab);
      }
    });
  } else {
    initializeUiWithTab(activeTab);
  }

  function initializeUiWithTab(tab) {
    const container = document.getElementById('app-content');
    initializeUi(tab, container, connectionStream, (err, store) => {
      if (err) {
        // if there's an error, store will be = metamaskState
        displayCriticalError(container, err, store);
        return;
      }

      const state = store.getState();
      const { metamask: { completedOnboarding } = {} } = state;

      if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
        global.platform.openExtensionInBrowser();
      }
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
