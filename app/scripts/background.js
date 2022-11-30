/**
 * @file The entry point for the web extension singleton process.
 */
import log from 'loglevel';
import browser from 'webextension-polyfill';

import { EXTENSION_MESSAGES } from '../../shared/constants/app';
import { EVENT, EVENT_NAMES, TRAITS } from '../../shared/constants/metametrics';
import { checkForLastErrorAndLog } from '../../shared/modules/browser-runtime.utils';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import migrations from './migrations';
import Migrator from './lib/migrator';
import ExtensionPlatform from './platforms/extension';
import LocalStore from './lib/local-store';
import ReadOnlyNetworkStore from './lib/network-store';

import NotificationManager from './lib/notification-manager';
import rawFirstTimeState from './first-time-state';
import getFirstPreferredLangCode from './lib/get-first-preferred-lang-code';
import getObjStructure from './lib/getObjStructure';
import BackgroundController from './background-controller';
/* eslint-enable import/first */

const { sentry } = global;
const firstTimeState = { ...rawFirstTimeState };

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'info');

const platform = new ExtensionPlatform();

const notificationManager = new NotificationManager();
global.METAMASK_NOTIFIER = notificationManager;

let controller;

// state persistence
const inTest = process.env.IN_TEST;
const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();
let versionedData;

if (inTest || process.env.METAMASK_DEBUG) {
  global.stateHooks.metamaskGetState = localStore.get.bind(localStore);
}

const ONE_SECOND_IN_MILLISECONDS = 1_000;
// Timeout for initializing phishing warning page.
const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

/**
 * Sends a message to the dapp(s) content script to signal it can connect to MetaMask background as
 * the backend is not active. It is required to re-connect dapps after service worker re-activates.
 * For non-dapp pages, the message will be sent and ignored.
 */
const sendReadyMessageToTabs = async () => {
  const tabs = await browser.tabs
    .query({
      /**
       * Only query tabs that our extension can run in. To do this, we query for all URLs that our
       * extension can inject scripts in, which is by using the "<all_urls>" value and __without__
       * the "tabs" manifest permission. If we included the "tabs" permission, this would also fetch
       * URLs that we'd not be able to inject in, e.g. chrome://pages, chrome://extension, which
       * is not what we'd want.
       *
       * You might be wondering, how does the "url" param work without the "tabs" permission?
       *
       * @see {@link https://bugs.chromium.org/p/chromium/issues/detail?id=661311#c1}
       *  "If the extension has access to inject scripts into Tab, then we can return the url
       *   of Tab (because the extension could just inject a script to message the location.href)."
       */
      url: '<all_urls>',
      windowType: 'normal',
    })
    .then((result) => {
      checkForLastErrorAndLog();
      return result;
    })
    .catch(() => {
      checkForLastErrorAndLog();
    });

  /** @todo we should only sendMessage to dapp tabs, not all tabs. */
  for (const tab of tabs) {
    browser.tabs
      .sendMessage(tab.id, {
        name: EXTENSION_MESSAGES.READY,
      })
      .then(() => {
        checkForLastErrorAndLog();
      })
      .catch(() => {
        // An error may happen if the contentscript is blocked from loading,
        // and thus there is no runtime.onMessage handler to listen to the message.
        checkForLastErrorAndLog();
      });
  }
};

initialize().catch(log.error);

/**
 * @typedef {import('../../shared/constants/transaction').TransactionMeta} TransactionMeta
 */

/**
 * The data emitted from the MetaMaskController.store EventEmitter, also used to initialize the MetaMaskController. Available in UI on React state as state.metamask.
 *
 * @typedef MetaMaskState
 * @property {boolean} isInitialized - Whether the first vault has been created.
 * @property {boolean} isUnlocked - Whether the vault is currently decrypted and accounts are available for selection.
 * @property {boolean} isAccountMenuOpen - Represents whether the main account selection UI is currently displayed.
 * @property {object} identities - An object matching lower-case hex addresses to Identity objects with "address" and "name" (nickname) keys.
 * @property {object} unapprovedTxs - An object mapping transaction hashes to unapproved transactions.
 * @property {Array} frequentRpcList - A list of frequently used RPCs, including custom user-provided ones.
 * @property {Array} addressBook - A list of previously sent to addresses.
 * @property {object} contractExchangeRates - Info about current token prices.
 * @property {Array} tokens - Tokens held by the current user, including their balances.
 * @property {object} send - TODO: Document
 * @property {boolean} useBlockie - Indicates preferred user identicon format. True for blockie, false for Jazzicon.
 * @property {object} featureFlags - An object for optional feature flags.
 * @property {boolean} welcomeScreen - True if welcome screen should be shown.
 * @property {string} currentLocale - A locale string matching the user's preferred display language.
 * @property {object} provider - The current selected network provider.
 * @property {string} provider.rpcUrl - The address for the RPC API, if using an RPC API.
 * @property {string} provider.type - An identifier for the type of network selected, allows MetaMask to use custom provider strategies for known networks.
 * @property {string} network - A stringified number of the current network ID.
 * @property {object} accounts - An object mapping lower-case hex addresses to objects with "balance" and "address" keys, both storing hex string values.
 * @property {hex} currentBlockGasLimit - The most recently seen block gas limit, in a lower case hex prefixed string.
 * @property {TransactionMeta[]} currentNetworkTxList - An array of transactions associated with the currently selected network.
 * @property {object} unapprovedMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedMsgCount - The number of messages in unapprovedMsgs.
 * @property {object} unapprovedPersonalMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedPersonalMsgCount - The number of messages in unapprovedPersonalMsgs.
 * @property {object} unapprovedEncryptionPublicKeyMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedEncryptionPublicKeyMsgCount - The number of messages in EncryptionPublicKeyMsgs.
 * @property {object} unapprovedDecryptMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedDecryptMsgCount - The number of messages in unapprovedDecryptMsgs.
 * @property {object} unapprovedTypedMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedTypedMsgCount - The number of messages in unapprovedTypedMsgs.
 * @property {number} pendingApprovalCount - The number of pending request in the approval controller.
 * @property {string[]} keyringTypes - An array of unique keyring identifying strings, representing available strategies for creating accounts.
 * @property {Keyring[]} keyrings - An array of keyring descriptions, summarizing the accounts that are available for use, and what keyrings they belong to.
 * @property {string} selectedAddress - A lower case hex string of the currently selected address.
 * @property {string} currentCurrency - A string identifying the user's preferred display currency, for use in showing conversion rates.
 * @property {number} conversionRate - A number representing the current exchange rate from the user's preferred currency to Ether.
 * @property {number} conversionDate - A unix epoch date (ms) for the time the current conversion rate was last retrieved.
 * @property {boolean} forgottenPassword - Returns true if the user has initiated the password recovery screen, is recovering from seed phrase.
 */

/**
 * @typedef VersionedData
 * @property {MetaMaskState} data - The data emitted from MetaMask controller, or used to initialize it.
 * @property {number} version - The latest migration version that has been run.
 */

/**
 * Initializes the MetaMask controller, and sets up all platform configuration.
 *
 * @returns {Promise} Setup complete.
 */
async function initialize() {
  const backgroundController = new BackgroundController({
    localStore,
    platform,
    notificationManager,
  });

  try {
    const initState = await loadStateFromPersistence();
    const initLangCode = await getFirstPreferredLangCode();

    backgroundController.init(initState, initLangCode);

    if (!isManifestV3) {
      await loadPhishingWarningPage();
    }
    await sendReadyMessageToTabs();

    log.info('MetaMask initialization complete.');

    backgroundController.hasInitialized.resolve();
  } catch (error) {
    backgroundController.hasInitialized.reject(error);
  }
}

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
async function loadPhishingWarningPage() {
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
  } catch (error) {
    if (error instanceof PhishingWarningPageTimeoutError) {
      console.warn(
        'Phishing warning page timeout; page not guaraneteed to work offline.',
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

//
// State and Persistence
//

/**
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 *
 * @returns {Promise<MetaMaskState>} Last data emitted from previous instance of MetaMask.
 */
async function loadStateFromPersistence() {
  // migrations
  const migrator = new Migrator({ migrations });
  migrator.on('error', console.warn);

  // read from disk
  // first from preferred, async API:
  versionedData =
    (await localStore.get()) || migrator.generateInitialState(firstTimeState);

  // check if somehow state is empty
  // this should never happen but new error reporting suggests that it has
  // for a small number of users
  // https://github.com/metamask/metamask-extension/issues/3919
  if (versionedData && !versionedData.data) {
    // unable to recover, clear state
    versionedData = migrator.generateInitialState(firstTimeState);
    sentry.captureMessage('MetaMask - Empty vault found - unable to recover');
  }

  // report migration errors to sentry
  migrator.on('error', (err) => {
    // get vault structure without secrets
    const vaultStructure = getObjStructure(versionedData);
    sentry.captureException(err, {
      // "extra" key is required by Sentry
      extra: { vaultStructure },
    });
  });

  // migrate data
  versionedData = await migrator.migrateData(versionedData);
  if (!versionedData) {
    throw new Error('MetaMask - migrator returned undefined');
  }
  // this initializes the meta/version data as a class variable to be used for future writes
  localStore.setMetadata(versionedData.meta);

  // write to disk
  localStore.set(versionedData.data);

  // return just the data
  return versionedData.data;
}

//
// Etc...
//

// It adds the "App Installed" event into a queue of events, which will be tracked only after a user opts into metrics.
const addAppInstalledEvent = () => {
  if (controller) {
    controller.metaMetricsController.updateTraits({
      [TRAITS.INSTALL_DATE_EXT]: new Date().toISOString().split('T')[0], // yyyy-mm-dd
    });
    controller.metaMetricsController.addEventBeforeMetricsOptIn({
      category: EVENT.CATEGORIES.APP,
      event: EVENT_NAMES.APP_INSTALLED,
      properties: {},
    });
    return;
  }
  setTimeout(() => {
    // If the controller is not set yet, we wait and try to add the "App Installed" event again.
    addAppInstalledEvent();
  }, 1000);
};

// On first install, open a new tab with MetaMask
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (
    reason === 'install' &&
    !(process.env.METAMASK_DEBUG || process.env.IN_TEST)
  ) {
    addAppInstalledEvent();
    platform.openExtensionInBrowser();
  }
});
