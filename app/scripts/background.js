/**
 * @file The entry point for the web extension singleton process.
 */

// Disabled to allow setting up initial state hooks first

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
import './lib/setup-initial-state-hooks';

// Import this very early, so globalThis.INFURA_PROJECT_ID_FROM_MANIFEST_FLAGS is always defined
import '../../shared/constants/infura-project-id';

import { finished } from 'readable-stream';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import { isObject, hasProperty } from '@metamask/utils';
import { ExtensionPortStream } from 'extension-port-stream';
import { withResolvers } from '../../shared/lib/promise-with-resolvers';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_FIREFOX,
  MESSAGE_TYPE,
} from '../../shared/constants/app';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import { BACKGROUND_LIVENESS_METHOD } from '../../shared/constants/background-liveness-check';
import {
  REJECT_NOTIFICATION_CLOSE,
  REJECT_NOTIFICATION_CLOSE_SIG,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../shared/constants/metametrics';
import { checkForLastErrorAndLog } from '../../shared/modules/browser-runtime.utils';
import { isManifestV3 } from '../../shared/modules/mv3.utils';
import { maskObject } from '../../shared/modules/object.utils';
import {
  OffscreenCommunicationTarget,
  OffscreenCommunicationEvents,
} from '../../shared/constants/offscreen-communication';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { createCaipStream } from '../../shared/modules/caip-stream';
import getFetchWithTimeout from '../../shared/modules/fetch-with-timeout';
import { isStateCorruptionError } from '../../shared/constants/errors';
import getFirstPreferredLangCode from '../../shared/lib/get-first-preferred-lang-code';
import { getManifestFlags } from '../../shared/lib/manifestFlags';
import { DISPLAY_GENERAL_STARTUP_ERROR } from '../../shared/constants/start-up-errors';
import { HYPERLIQUID_ORIGIN } from '../../shared/constants/referrals';
import {
  CorruptionHandler,
  hasVault,
} from './lib/state-corruption/state-corruption-recovery';
import {
  backedUpStateKeys,
  PersistenceManager,
} from './lib/stores/persistence-manager';
import ExtensionStore from './lib/stores/extension-store';
import { FixtureExtensionStore } from './lib/stores/fixture-extension-store';
import migrations from './migrations';
import Migrator from './lib/migrator';
import { updateRemoteFeatureFlags } from './lib/update-remote-feature-flags';
import ExtensionPlatform from './platforms/extension';
import { SENTRY_BACKGROUND_STATE } from './constants/sentry-state';

import NotificationManager, {
  NOTIFICATION_MANAGER_EVENTS,
} from './lib/notification-manager';
import MetamaskController, {
  METAMASK_CONTROLLER_EVENTS,
} from './metamask-controller';
import getObjStructure from './lib/getObjStructure';
import setupEnsIpfsResolver from './lib/ens-ipfs/setup';
import { getPlatform, shouldEmitDappViewedEvent } from './lib/util';
import { createOffscreen } from './offscreen';
import { setupMultiplex } from './lib/stream-utils';
import rawFirstTimeState from './first-time-state';
import { onUpdate } from './on-update';

/* eslint-enable import/first */

import { COOKIE_ID_MARKETING_WHITELIST_ORIGINS } from './constants/marketing-site-whitelist';
import {
  METAMASK_CAIP_MULTICHAIN_PROVIDER,
  METAMASK_EIP_1193_PROVIDER,
} from './constants/stream';
import { PREINSTALLED_SNAPS_URLS } from './constants/snaps';
import { ExtensionLazyListener } from './lib/extension-lazy-listener/extension-lazy-listener';
import { DeepLinkRouter } from './lib/deep-links/deep-link-router';
import { createEvent } from './lib/deep-links/metrics';
import { getRequestSafeReload } from './lib/safe-reload';
import { tryPostMessage } from './lib/start-up-errors/start-up-errors';
import { CronjobControllerStorageManager } from './lib/CronjobControllerStorageManager';
import { HyperliquidPermissionTriggerType } from './lib/createHyperliquidReferralMiddleware';

/**
 * @typedef {import('./lib/stores/persistence-manager').Backup} Backup
 */

// MV3 configures the ExtensionLazyListener in service-worker.ts and sets it on globalThis.stateHooks,
// but in MV2 we don't need to do that, so we create it here (and we don't add any lazy listeners,
// as it doesn't need them).
const lazyListener =
  globalThis.stateHooks.lazyListener ?? new ExtensionLazyListener(browser);

// eslint-disable-next-line @metamask/design-tokens/color-no-hex
const BADGE_COLOR_APPROVAL = '#0376C9';
const BADGE_MAX_COUNT = 9;

const inTest = process.env.IN_TEST;
const useFixtureStore =
  inTest && getManifestFlags().testing?.forceExtensionStore !== true;
const localStore = useFixtureStore
  ? new FixtureExtensionStore({ initialize: true })
  : new ExtensionStore();
const persistenceManager = new PersistenceManager({ localStore });

const { update, requestSafeReload } = getRequestSafeReload(persistenceManager);

// Setup global hook for improved Sentry state snapshots during initialization
global.stateHooks.getMostRecentPersistedState = () =>
  persistenceManager.mostRecentRetrievedState;

/**
 * A helper function to log the current state of the vault. Useful for debugging
 * purposes, to, in the case of database corruption, an possible way for an end
 * user to recover their vault. Hopefully this is never needed.
 */
global.logEncryptedVault = () => {
  persistenceManager.logEncryptedVault();
};

const { sentry } = global;
let firstTimeState = { ...rawFirstTimeState };

const metamaskInternalProcessHash = {
  [ENVIRONMENT_TYPE_POPUP]: true,
  [ENVIRONMENT_TYPE_NOTIFICATION]: true,
  [ENVIRONMENT_TYPE_FULLSCREEN]: true,
};

const metamaskBlockedPorts = ['trezor-connect'];

log.setLevel(process.env.METAMASK_DEBUG ? 'debug' : 'info', false);

const platform = new ExtensionPlatform();
const notificationManager = new NotificationManager();
const isFirefox = getPlatform() === PLATFORM_FIREFOX;

let openPopupCount = 0;
let notificationIsOpen = false;
let uiIsTriggering = false;
let sidePanelIsOpen = false;
const openMetamaskTabsIDs = {};
const requestAccountTabIds = {};
let controller;
const senderOriginMapping = {};
const tabOriginMapping = {};

if (inTest || process.env.METAMASK_DEBUG) {
  global.stateHooks.metamaskGetState = persistenceManager.get.bind(
    persistenceManager,
    { validateVault: false },
  );
}

const phishingPageUrl = new URL(process.env.PHISHING_WARNING_PAGE_URL);

// normalized (adds a trailing slash to the end of the domain if it's missing)
// the URL once and reuse it:
const phishingPageHref = phishingPageUrl.toString();

const ONE_SECOND_IN_MILLISECONDS = 1_000;
// Timeout for initializing phishing warning page.
const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

lazyListener.once('runtime', 'onInstalled').then((details) => {
  handleOnInstalled(details);
});

/**
 * This deferred Promise is used to track whether initialization has finished.
 *
 * It is very important to ensure that `resolveInitialization` is *always*
 * called once initialization has completed, and that `rejectInitialization` is
 * called if initialization fails in an unrecoverable way.
 */
/**
 * @type {Promise<void>}
 */
let isInitialized;
/**
 * @type {() => void}
 */
let resolveInitialization;
/**
 * @type {() => void}
 */
let rejectInitialization;

/**
 * Creates a deferred Promise and sets the global variables to track the
 * state of application initialization (or re-initialization).
 */
function setGlobalInitializers() {
  const deferred = withResolvers();
  isInitialized = deferred.promise;
  resolveInitialization = deferred.resolve;
  rejectInitialization = deferred.reject;
}
setGlobalInitializers();

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
        // An error may happen if:
        //  * a contentscript is blocked from loading, and thus there is no
        // `runtime.onMessage` handlers to listen to the message, or
        //  * if MetaMask reloads/installs while tabs are already open, as these
        // tabs won't have a valid Port to send the message to.
        checkForLastErrorAndLog();
      });
  }
};

/**
 * Detects known phishing pages as soon as the browser begins to load the
 * page. If the page is a known phishing page, the user is redirected to the
 * phishing warning page.
 *
 * This detection works even if the phishing page is now a redirect to a new
 * domain that our phishing detection system is not aware of.
 *
 * @param {MetamaskController} theController
 */
function maybeDetectPhishing(theController) {
  /**
   * Redirects a tab to the phishing warning page.
   *
   * @param {number} tabId - The ID of the tab to redirect
   * @param {string} url - The URL to redirect to (phishing warning page)
   * @returns {Promise<boolean>} Returns true if the redirect was successful, false otherwise.
   *   Returns false for Google pre-fetch requests or if the redirect fails.
   */
  async function redirectTab(tabId, url) {
    try {
      const tab = await browser.tabs.get(tabId);

      // Prevent redirect when due to Google pre-fetching
      if (tab.url && tab.url.startsWith('https://www.google.com/search')) {
        return false;
      }

      await browser.tabs.update(tabId, {
        url,
      });
      return true;
    } catch (error) {
      sentry?.captureException(error);
      return false;
    }
  }
  // we can use the blocking API in MV2, but not in MV3
  const isManifestV2 = !isManifestV3;
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId === browser.tabs.TAB_ID_NONE) {
        return {};
      }

      const { completedOnboarding } = theController.onboardingController.state;
      if (!completedOnboarding) {
        return {};
      }

      const prefState = theController.preferencesController.state;
      if (!prefState.usePhishDetect) {
        return {};
      }

      // ignore requests that come from our phishing warning page, as
      // the requests may come from the "continue to site" link, so we'll
      // actually _want_ to bypass the phishing detection. We shouldn't have to
      // do this, because the phishing site does tell the extension that the
      // domain it blocked it now "safe", but it does this _after_ the request
      // begins (which would get blocked by this listener). So we have to bail
      // on detection here.
      // This check can be removed once  https://github.com/MetaMask/phishing-warning/issues/160
      // is shipped.
      if (
        details.initiator &&
        details.initiator !== 'null' &&
        // compare normalized URLs
        new URL(details.initiator).host === phishingPageUrl.host
      ) {
        return {};
      }

      const { hostname, href, searchParams } = new URL(details.url);
      if (
        inTest &&
        searchParams.has('IN_TEST_BYPASS_EARLY_PHISHING_DETECTION')
      ) {
        // this is a test page that needs to bypass early phishing detection
        return {};
      }

      theController.phishingController.maybeUpdateState();

      const blockedRequestResponse =
        theController.phishingController.isBlockedRequest(details.url);

      let phishingTestResponse;
      if (details.type === 'main_frame' || details.type === 'sub_frame') {
        phishingTestResponse = theController.phishingController.test(
          details.url,
        );
      }

      // if the request is not blocked, and the phishing test is not blocked, return and don't show the phishing screen
      if (!phishingTestResponse?.result && !blockedRequestResponse.result) {
        return {};
      }

      // Determine the block reason based on the type
      let blockReason;
      let blockedUrl = href;
      if (phishingTestResponse?.result && blockedRequestResponse.result) {
        blockReason = `${phishingTestResponse.type} and ${blockedRequestResponse.type}`;
      } else if (phishingTestResponse?.result) {
        blockReason = phishingTestResponse.type;
      } else {
        // Override the blocked URL to the initiator URL if the request was flagged by c2 detection
        blockReason = blockedRequestResponse.type;
        blockedUrl = details.initiator;
      }

      let blockedHostname;
      try {
        blockedHostname = new URL(blockedUrl).hostname;
      } catch {
        // If blockedUrl is null or undefined, fall back to the original URL
        blockedHostname = hostname;
        blockedUrl = href;
      }

      const querystring = new URLSearchParams({
        hostname: blockedHostname, // used for creating the EPD issue title (false positive report)
        href: blockedUrl, // used for displaying the URL on the phsihing warning page + proceed anyway URL
      });
      const redirectUrl = new URL(phishingPageHref);
      redirectUrl.hash = querystring.toString();
      const redirectHref = redirectUrl.toString();

      // Helper function to track phishing page metrics
      const trackPhishingMetrics = () => {
        if (!isFirefox) {
          theController.metaMetricsController.trackEvent(
            {
              // should we differentiate between background redirection and content script redirection?
              event: MetaMetricsEventName.PhishingPageDisplayed,
              category: MetaMetricsEventCategory.Phishing,
              properties: {
                url: blockedUrl,
                referrer: {
                  url: blockedUrl,
                },
                reason: blockReason,
                requestDomain: blockedRequestResponse.result
                  ? hostname
                  : undefined,
              },
            },
            {
              excludeMetaMetricsId: true,
            },
          );
        }
      };

      // blocking is better than tab redirection, as blocking will prevent
      // the browser from loading the page at all
      if (isManifestV2) {
        // We can redirect `main_frame` requests directly to the warning page.
        // For non-`main_frame` requests (e.g. `sub_frame` or WebSocket), we cancel them
        // and redirect the whole tab asynchronously so that the user sees the warning.
        if (details.type === 'main_frame') {
          trackPhishingMetrics();
          return { redirectUrl: redirectHref };
        }
        redirectTab(details.tabId, redirectHref).then((redirected) => {
          if (redirected) {
            trackPhishingMetrics();
          }
        });
        return { cancel: true };
      }
      redirectTab(details.tabId, redirectHref).then((redirected) => {
        if (redirected) {
          trackPhishingMetrics();
        }
      });
      return {};
    },
    {
      urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'],
    },
    isManifestV2 ? ['blocking'] : [],
  );
}

// These are set after initialization
/**
 * Connects a WindowPostMessage Port to the MetaMask controller.
 * This method identifies trusted (MetaMask) interfaces, and connects them differently from untrusted (web pages).
 *
 * @callback ConnectWindowPostMessage
 * @param {chrome.runtime.Port} remotePort - The port provided by a new context.
 * @returns {void}
 */
/** @type {ConnectWindowPostMessage} */
let connectWindowPostMessage;

/**
 * Connects a externally_connecatable Port to the MetaMask controller.
 * This method identifies dapp clients and connects them differently from extension clients.
 *
 * @callback ConnectExternallyConnectable
 * @param {chrome.runtime.Port} remotePort - The port provided by a new context.
 */
/** @type {ConnectExternallyConnectable} */
let connectExternallyConnectable;

/**
 * Connects a Duplexstream to the MetaMask controller EIP-1193 API (via a multiplexed duplex stream).
 *
 * @callback ConnectEip1193
 * @param {DuplexStream} connectionStream - The duplex stream.
 * @param {chrome.runtime.MessageSender} sender - The remote port sender.
 */
/** @type {ConnectEip1193} */
let connectEip1193;

/**
 * Connects a DuplexStream to the MetaMask controller Caip Multichain API.
 *
 * @callback ConnectCaipMultichain
 * @param {DuplexStream} connectionStream - The duplex stream.
 * @param {chrome.runtime.MessageSender} sender - The remote port sender.
 */
/** @type {ConnectCaipMultichain} */
let connectCaipMultichain;

const corruptionHandler = new CorruptionHandler();
/**
 * Handles the onConnect event.
 *
 * @param {browser.Runtime.Port} port - The port provided by a new context.
 */
const handleOnConnect = async (port) => {
  if (
    inTest &&
    getManifestFlags().testing?.simulateUnresponsiveBackground === true
  ) {
    return;
  }

  try {
    // `handleOnConnect` can be called asynchronously, well after the `onConnect`
    // event was emitted, due to the lazy listener setup in `service-worker.ts`, so we
    // might not be able to send this message if the window has already closed.
    port.postMessage({
      data: {
        method: BACKGROUND_LIVENESS_METHOD,
      },
      name: 'background-liveness',
    });
  } catch (e) {
    log.error(
      'MetaMask - background-liveness check: Failed to message to port',
      e,
    );
    // window already closed, no need to continue.
    return;
  }

  // Queue up connection attempts here, waiting until after initialization
  try {
    await isInitialized;

    // This is set in `setupController`, which is called as part of initialization
    connectWindowPostMessage(port);
  } catch (error) {
    sentry?.captureException(error);

    // if we have a STATE_CORRUPTION_ERROR tell the user about it and offer to
    // restore from a backup, if we have one.
    if (isStateCorruptionError(error)) {
      await corruptionHandler.handleStateCorruptionError({
        port,
        error,
        database: persistenceManager,
        repairCallback: async (backup) => {
          // we are going to reinitialize the background script, so we need to
          // reset the initialization promises. this is gross since it is
          // possible the original references could have been passed to other
          // functions, and we can't update those references from here.
          // right now, that isn't the case though.
          setGlobalInitializers();

          if (hasVault(backup)) {
            await initBackground(backup);
            controller.onboardingController.setFirstTimeFlowType(
              FirstTimeFlowType.restore,
            );
          } else {
            // if we don't have a backup we need to make sure we clear the state
            // from the database, and then reinitialize the background script
            // with the first time state.
            await persistenceManager.reset();
            await initBackground(null);
          }
        },
      });
    } else {
      const errorLike = isObject(error)
        ? {
            message: error.message ?? 'Unknown error',
            name: error.name ?? 'UnknownError',
            stack: error.stack,
          }
        : {
            message: String(error),
            name: 'UnknownError',
            stack: '',
          };
      // general errors
      tryPostMessage(port, DISPLAY_GENERAL_STARTUP_ERROR, {
        error: errorLike,
        currentLocale: controller?.preferencesController?.state?.currentLocale,
      });
    }
  }
};
const installOnConnectListener = () => {
  lazyListener.addListener('runtime', 'onConnect', handleOnConnect);
};
if (
  inTest &&
  getManifestFlags().testing?.simulatedSlowBackgroundLoadingTimeout
) {
  const { simulatedSlowBackgroundLoadingTimeout } = getManifestFlags().testing;
  setTimeout(installOnConnectListener, simulatedSlowBackgroundLoadingTimeout);
} else {
  installOnConnectListener();
}

browser.runtime.onConnectExternal.addListener(async (...args) => {
  // Queue up connection attempts here, waiting until after initialization
  await isInitialized;
  // This is set in `setupController`, which is called as part of initialization
  connectExternallyConnectable(...args);
});

function saveTimestamp() {
  const timestamp = new Date().toISOString();

  browser.storage.session.set({ timestamp });
}

/**
 * @typedef {import('@metamask/transaction-controller').TransactionMeta} TransactionMeta
 */

/**
 * The data emitted from the MetaMaskController.store EventEmitter, also used to initialize the MetaMaskController. Available in UI on React state as state.metamask.
 *
 * @typedef MetaMaskState
 * @property {boolean} isInitialized - Whether the first vault has been created.
 * @property {boolean} isUnlocked - Whether the vault is currently decrypted and accounts are available for selection.
 * @property {boolean} isAccountMenuOpen - Represents whether the main account selection UI is currently displayed.
 * @property {boolean} isNetworkMenuOpen - Represents whether the main network selection UI is currently displayed.
 * @property {object} identities - An object matching lower-case hex addresses to Identity objects with "address" and "name" (nickname) keys.
 * @property {object} networkConfigurations - A list of network configurations, containing RPC provider details (eg chainId, rpcUrl, rpcPreferences).
 * @property {Array} addressBook - A list of previously sent to addresses.
 * @property {object} marketData - A map from chain ID -> contract address -> an object containing the token's market data.
 * @property {Array} tokens - Tokens held by the current user, including their balances.
 * @property {object} send - TODO: Document
 * @property {boolean} useBlockie - Indicates preferred user identicon format. True for blockie, false for Jazzicon.
 * @property {object} featureFlags - An object for optional feature flags.
 * @property {boolean} welcomeScreen - True if welcome screen should be shown.
 * @property {string} currentLocale - A locale string matching the user's preferred display language.
 * @property {string} networkStatus - Either "unknown", "available", "unavailable", or "blocked", depending on the status of the currently selected network.
 * @property {object} accountsByChainId - An object mapping lower-case hex addresses to objects with "balance" and "address" keys, both storing hex string values keyed by chain id.
 * @property {object} unapprovedPersonalMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedPersonalMsgCount - The number of messages in unapprovedPersonalMsgs.
 * @property {object} unapprovedEncryptionPublicKeyMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedEncryptionPublicKeyMsgCount - The number of messages in EncryptionPublicKeyMsgs.
 * @property {object} unapprovedDecryptMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedDecryptMsgCount - The number of messages in unapprovedDecryptMsgs.
 * @property {object} unapprovedTypedMessages - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedTypedMessagesCount - The number of messages in unapprovedTypedMessages.
 * @property {number} pendingApprovalCount - The number of pending request in the approval controller.
 * @property {Keyring[]} keyrings - An array of keyring descriptions, summarizing the accounts that are available for use, and what keyrings they belong to.
 * @property {string} selectedAddress - A lower case hex string of the currently selected address.
 * @property {string} currentCurrency - A string identifying the user's preferred display currency, for use in showing conversion rates.
 * @property {number} currencyRates - An object mapping of nativeCurrency to conversion rate and date
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
 * @param {Backup | null} backup
 * @returns {Promise} Setup complete.
 */
async function initialize(backup) {
  const offscreenPromise = isManifestV3 ? createOffscreen() : null;

  const initData = await loadStateFromPersistence(backup);

  const initState = initData.data;
  const initLangCode = await getFirstPreferredLangCode();

  let isFirstMetaMaskControllerSetup;

  // We only want to start this if we are running a test build, not for the release build.
  // `navigator.webdriver` is true if Selenium, Puppeteer, or Playwright are running.
  // In MV3, the Service Worker sees `navigator.webdriver` as `undefined`, so this will trigger from
  // an Offscreen Document message instead. Because it's a singleton class, it's safe to start multiple times.
  if (process.env.IN_TEST && window.navigator?.webdriver) {
    const { getSocketBackgroundToMocha } =
      // Use `require` to make it easier to exclude this test code from the Browserify build.
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
      require('../../test/e2e/background-socket/socket-background-to-mocha');
    getSocketBackgroundToMocha();
  }

  if (isManifestV3) {
    // Save the timestamp immediately and then every `SAVE_TIMESTAMP_INTERVAL`
    // miliseconds. This keeps the service worker alive.
    if (initState.PreferencesController?.enableMV3TimestampSave !== false) {
      const SAVE_TIMESTAMP_INTERVAL_MS = 2 * 1000;

      saveTimestamp();
      setInterval(saveTimestamp, SAVE_TIMESTAMP_INTERVAL_MS);
    }

    const sessionData = await browser.storage.session.get([
      'isFirstMetaMaskControllerSetup',
    ]);

    isFirstMetaMaskControllerSetup =
      sessionData?.isFirstMetaMaskControllerSetup === undefined;
    await browser.storage.session.set({ isFirstMetaMaskControllerSetup });
  }

  const overrides = inTest
    ? {
        keyrings: {
          // Use `require` to make it easier to exclude this test code from the Browserify build.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
          trezorBridge: require('../../test/stub/keyring-bridge')
            .FakeTrezorBridge,
          // Use `require` to make it easier to exclude this test code from the Browserify build.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
          ledgerBridge: require('../../test/stub/keyring-bridge')
            .FakeLedgerBridge,
          // Use `require` to make it easier to exclude this test code from the Browserify build.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
          qrBridge: require('../../test/stub/keyring-bridge').FakeQrBridge,
        },
      }
    : {};

  const preinstalledSnaps = await loadPreinstalledSnaps();
  const cronjobControllerStorageManager = new CronjobControllerStorageManager();
  await cronjobControllerStorageManager.init();

  setupController(
    initState,
    initLangCode,
    overrides,
    isFirstMetaMaskControllerSetup,
    initData.meta,
    offscreenPromise,
    preinstalledSnaps,
    cronjobControllerStorageManager,
  );

  // `setupController` sets up the `controller` object, so we can use it now:
  maybeDetectPhishing(controller);

  if (!isManifestV3) {
    await loadPhishingWarningPage();
  }
  await sendReadyMessageToTabs();

  new DeepLinkRouter({
    getExtensionURL: platform.getExtensionURL,
    getState: controller.getState.bind(controller),
  })
    .on('navigate', async ({ url, parsed }) => {
      // don't track deep links that are immediately redirected (like /buy)
      if (!('redirectTo' in parsed)) {
        await controller.metaMetricsController.trackEvent(
          createEvent({ signature: parsed.signature, url }),
        );
      }
    })
    .on('error', (error) => sentry?.captureException(error))
    .install();
}

/**
 * Loads the preinstalled snaps from urls and returns them as an array.
 * It fails if any Snap fails to load in the expected time range.
 * Supports .json.gz files using gzip decompression.
 */
async function loadPreinstalledSnaps() {
  const fetchWithTimeout = getFetchWithTimeout();
  const promises = PREINSTALLED_SNAPS_URLS.map(async (url) => {
    const response = await fetchWithTimeout(url);

    // If the Snap is compressed, decompress it
    if (url.pathname.endsWith('.json.gz')) {
      const ds = new DecompressionStream('gzip');
      const decompressedStream = response.body.pipeThrough(ds);
      return await new Response(decompressedStream).json();
    }

    return await response.json();
  });

  return Promise.all(promises);
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
    const extensionStartupPhishingPageUrl = new URL(phishingPageHref);
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

//
// State and Persistence
//

/**
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 *
 * @param {Backup | null} backup
 * @returns {Promise<{data: MetaMaskState meta: {version: number}}>} Last data emitted from previous instance of MetaMask.
 */
export async function loadStateFromPersistence(backup) {
  if (process.env.WITH_STATE) {
    const withState = JSON.parse(process.env.WITH_STATE);

    // Use `require` to make it easier to exclude this test code from the Browserify build.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
    const { generateWalletState } = require('./fixtures/generate-wallet-state');
    const fixtureBuilder = await generateWalletState(withState, false);

    const stateOverrides = fixtureBuilder.fixture.data;
    firstTimeState = { ...firstTimeState, ...stateOverrides };
  }

  // read from disk
  // first from preferred, async API:
  /**
   * @type {import("./lib/stores/base-store").MetaMaskStorageStructure | undefined}
   */
  let preMigrationVersionedData;
  if (backup) {
    preMigrationVersionedData = { data: {}, meta: {} };
    for (const key of backedUpStateKeys) {
      if (hasProperty(backup, key)) {
        preMigrationVersionedData.data[key] = backup[key];
      }
    }
    // use the meta property from the backup if it exists, that way the
    // migrations will behave correctly.
    if (hasProperty(backup, 'meta') && isObject(backup.meta)) {
      preMigrationVersionedData.meta = backup.meta;
    }
    // sanity check on the meta property
    if (typeof preMigrationVersionedData.meta.version !== 'number') {
      log.error(
        "The `backup`'s `meta.version` property was missing during backup restore.",
      );
      // the last migration version before we started storing backups was `155`
      // so we can use that version as a fallback.
      preMigrationVersionedData.meta.version = 155;
    }
  } else {
    const validateVault = true;
    preMigrationVersionedData = await persistenceManager.get({ validateVault });
  }

  const migrator = new Migrator({
    migrations,
    defaultVersion: process.env.WITH_STATE
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
        require('../../test/e2e/fixtures/fixture-builder')
          .FIXTURE_STATE_METADATA_VERSION
      : null,
  });

  // report migration errors to sentry
  migrator.on('error', (err) => {
    console.warn(err);
    // get vault structure without secrets
    const vaultStructure = getObjStructure(preMigrationVersionedData);
    sentry.captureException(err, {
      // "extra" key is required by Sentry
      extra: { vaultStructure },
    });
  });

  if (!preMigrationVersionedData?.data && !preMigrationVersionedData?.meta) {
    preMigrationVersionedData = migrator.generateInitialState(firstTimeState);
  }

  // migrate data
  const versionedData = await migrator.migrateData(preMigrationVersionedData);
  if (!versionedData) {
    throw new Error('MetaMask - migrator returned undefined');
  } else if (!isObject(versionedData.meta)) {
    throw new Error(
      `MetaMask - migrator metadata has invalid type '${typeof versionedData.meta}'`,
    );
  } else if (typeof versionedData.meta.version !== 'number') {
    throw new Error(
      `MetaMask - migrator metadata version has invalid type '${typeof versionedData
        .meta.version}'`,
    );
  } else if (!isObject(versionedData.data)) {
    throw new Error(
      `MetaMask - migrator data has invalid type '${typeof versionedData.data}'`,
    );
  }
  // this initializes the meta/version data as a class variable to be used for future writes
  persistenceManager.setMetadata(versionedData.meta);

  // write to disk
  await persistenceManager.set(versionedData.data);

  // return just the data
  return versionedData;
}

/**
 * Emit event of DappViewed,
 * which should only be tracked only after a user opts into metrics and connected to the dapp
 *
 * @param {string} origin - URL of visited dapp
 */
function emitDappViewedMetricEvent(origin) {
  const { metaMetricsId } = controller.metaMetricsController.state;
  if (!shouldEmitDappViewedEvent(metaMetricsId)) {
    return;
  }

  const numberOfConnectedAccounts =
    controller.getPermittedAccounts(origin).length;
  if (numberOfConnectedAccounts === 0) {
    return;
  }

  const preferencesState = controller.controllerMessenger.call(
    'PreferencesController:getState',
  );
  const numberOfTotalAccounts = Object.keys(preferencesState.identities).length;

  controller.metaMetricsController.trackEvent(
    {
      event: MetaMetricsEventName.DappViewed,
      category: MetaMetricsEventCategory.InpageProvider,
      referrer: {
        url: origin,
      },
      properties: {
        is_first_visit: false,
        number_of_accounts: numberOfTotalAccounts,
        number_of_accounts_connected: numberOfConnectedAccounts,
      },
    },
    {
      excludeMetaMetricsId: true,
    },
  );
}

/**
 * Track dapp connection when loaded and permissioned
 *
 * @param {chrome.runtime.Port} remotePort - The port provided by a new context.
 */
function trackDappView(remotePort) {
  if (
    !remotePort.sender?.tab ||
    !remotePort.sender?.url ||
    !remotePort.sender?.tab?.url
  ) {
    return;
  }
  const tabId = remotePort.sender.tab.id;
  const url = new URL(remotePort.sender.url);
  const { origin } = url;
  const tabUrl = new URL(remotePort.sender.tab.url);
  const { origin: tabOrigin } = tabUrl;

  // store the origin to corresponding tab so it can provide info for onActivated listener
  if (!Object.keys(senderOriginMapping).includes(tabId)) {
    senderOriginMapping[tabId] = origin;
  }
  // do the same for tab origin, which can be different to sender origin
  if (!(tabId in tabOriginMapping)) {
    tabOriginMapping[tabId] = tabOrigin;
  }

  const isConnectedToDapp = controller.controllerMessenger.call(
    'PermissionController:hasPermissions',
    origin,
  );

  // when open a new tab, this event will trigger twice, only 2nd time is with dapp loaded
  const isTabLoaded = remotePort.sender.tab.title !== 'New Tab';

  // *** Emit DappViewed metric event when ***
  // - refresh the dapp
  // - open dapp in a new tab
  if (isConnectedToDapp && isTabLoaded) {
    emitDappViewedMetricEvent(origin);
  }
}

/**
 * Emit App Opened event
 */
function emitAppOpenedMetricEvent() {
  const { metaMetricsId, participateInMetaMetrics } =
    controller.metaMetricsController.state;

  // Skip if user hasn't opted into metrics
  if (metaMetricsId === null && !participateInMetaMetrics) {
    return;
  }

  controller.metaMetricsController.trackEvent({
    event: MetaMetricsEventName.AppOpened,
    category: MetaMetricsEventCategory.App,
  });
}

/**
 * This function checks if the app is being opened
 * and emits an event only if no other UI instances are currently open.
 *
 * @param {string} environment - The environment type where the app is opening
 */
function trackAppOpened(environment) {
  // List of valid environment types to track
  const environmentTypeList = [
    ENVIRONMENT_TYPE_POPUP,
    ENVIRONMENT_TYPE_NOTIFICATION,
    ENVIRONMENT_TYPE_FULLSCREEN,
  ];

  // Check if any UI instances are currently open
  const isFullscreenOpen = Object.values(openMetamaskTabsIDs).some(Boolean);
  const isAlreadyOpen =
    isFullscreenOpen || notificationIsOpen || openPopupCount > 0;

  // Only emit event if no UI is open and environment is valid
  if (!isAlreadyOpen && environmentTypeList.includes(environment)) {
    emitAppOpenedMetricEvent();
  }
}

/**
 * Initializes the MetaMask Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {string} initLangCode - The region code for the language preferred by the current user.
 * @param {object} overrides - object with callbacks that are allowed to override the setup controller logic
 * @param isFirstMetaMaskControllerSetup
 * @param {object} stateMetadata - Metadata about the initial state and migrations, including the most recent migration version
 * @param {Promise<void>} offscreenPromise - A promise that resolves when the offscreen document has finished initialization.
 * @param {Array} preinstalledSnaps - A list of preinstalled Snaps loaded from disk during boot.
 * @param {CronjobControllerStorageManager} cronjobControllerStorageManager - A storage manager for the CronjobController.
 */
export function setupController(
  initState,
  initLangCode,
  overrides,
  isFirstMetaMaskControllerSetup,
  stateMetadata,
  offscreenPromise,
  preinstalledSnaps,
  cronjobControllerStorageManager,
) {
  //
  // MetaMask Controller
  //
  controller = new MetamaskController({
    infuraProjectId: globalThis.INFURA_PROJECT_ID,
    // User confirmation callbacks:
    showUserConfirmation: triggerUi,
    // initial state
    initState,
    // initial locale code
    initLangCode,
    // platform specific api
    platform,
    notificationManager,
    browser,
    getRequestAccountTabIds: () => {
      return requestAccountTabIds;
    },
    getOpenMetamaskTabsIds: () => {
      return openMetamaskTabsIDs;
    },
    overrides,
    isFirstMetaMaskControllerSetup,
    currentMigrationVersion: stateMetadata.version,
    featureFlags: {},
    offscreenPromise,
    preinstalledSnaps,
    requestSafeReload,
    cronjobControllerStorageManager,
  });

  /**
   * @type {Array<string>} List of controller store keys that have changed since initialization.
   */
  const changedControllerKeys = [];
  const currentState = controller.store.getState();
  for (const key of Object.keys(currentState)) {
    const initialControllerState = initState[key] || {};
    const newControllerState = currentState[key];
    const newControllerStateKeys = Object.keys(newControllerState);

    // if the number of keys has changed, we need to persist the new state
    if (
      newControllerStateKeys.length ===
      Object.keys(initialControllerState).length
    ) {
      // if any of the controller's own top-level keys have changed
      // (via reference comparison) we need to persist the new state.
      for (const subKey of newControllerStateKeys) {
        if (newControllerState[subKey] !== initialControllerState[subKey]) {
          changedControllerKeys.push(key);
          break;
        }
      }
    } else {
      changedControllerKeys.push(key);
    }
  }
  if (changedControllerKeys.length > 0) {
    log.info(
      `MetaMaskController state changed during configuration for controllers: ${changedControllerKeys.join(', ')}. Persisting updated state.`,
    );
    // persist the new state
    update(currentState).catch((error) => {
      log.error('Error persisting updated controller state:', error);
      sentry?.captureException(error);
    });
  }

  // this persistence hooks must happen before `controller.configureAllControllers`
  // or some updates might not be persisted!
  controller.store.on('update', update);
  controller.store.on('error', (error) => {
    log.error('MetaMask controller.store error:', error);
    sentry?.captureException(error);
  });

  setupEnsIpfsResolver({
    getCurrentChainId: () =>
      getCurrentChainId({ metamask: controller.networkController.state }),
    getIpfsGateway: controller.preferencesController.getIpfsGateway.bind(
      controller.preferencesController,
    ),
    getUseAddressBarEnsResolution: () =>
      controller.preferencesController.state.useAddressBarEnsResolution,
    provider: controller.provider,
  });

  setupSentryGetStateGlobal(controller);

  const isClientOpenStatus = () => {
    return (
      openPopupCount > 0 ||
      Boolean(Object.keys(openMetamaskTabsIDs).length) ||
      notificationIsOpen ||
      sidePanelIsOpen ||
      false
    );
  };

  const onCloseEnvironmentInstances = (isClientOpen, environmentType) => {
    // if all instances of metamask are closed we call a method on the controller to stop gasFeeController polling
    if (isClientOpen === false) {
      controller.onClientClosed();
      // otherwise we want to only remove the polling tokens for the environment type that has closed
    } else {
      // in the case of fullscreen environment a user might have multiple tabs open so we don't want to disconnect all of
      // its corresponding polling tokens unless all tabs are closed.
      if (
        environmentType === ENVIRONMENT_TYPE_FULLSCREEN &&
        Boolean(Object.keys(openMetamaskTabsIDs).length)
      ) {
        return;
      }
      controller.onEnvironmentTypeClosed(environmentType);
    }
  };

  connectWindowPostMessage = (remotePort) => {
    const processName = remotePort.name;

    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    let isMetaMaskInternalProcess = false;
    const senderUrl = remotePort.sender?.url
      ? new URL(remotePort.sender.url)
      : null;

    if (isFirefox) {
      isMetaMaskInternalProcess = metamaskInternalProcessHash[processName];
    } else {
      isMetaMaskInternalProcess =
        senderUrl?.origin === `chrome-extension://${browser.runtime.id}`;
    }

    if (isMetaMaskInternalProcess) {
      /**
       * @type {ExtensionPortStream}
       */
      const portStream =
        overrides?.getPortStream?.(remotePort) ||
        new ExtensionPortStream(remotePort);

      /**
       * send event to sentry with details about the event
       *
       * @param {import("extension-port-stream").MessageTooLargeEventData} details
       */
      const handleMessageTooLarge = function ({ chunkSize }) {
        /**
         * @type {MetamaskController}
         */
        const theController = controller;
        theController.metaMetricsController.trackEvent({
          event: MetaMetricsEventName.PortStreamChunked,
          category: MetaMetricsEventCategory.PortStream,
          properties: { chunkSize },
        });
      };
      remotePort.onDisconnect.addListener(() =>
        portStream.off('message-too-large', handleMessageTooLarge),
      );
      portStream.on('message-too-large', handleMessageTooLarge);

      // communication with popup
      controller.isClientOpen = true;
      controller.setupTrustedCommunication(portStream, remotePort.sender);
      trackAppOpened(processName);

      // lazily update the remote feature flags every time the UI is opened.
      updateRemoteFeatureFlags(controller);

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        openPopupCount += 1;
        finished(portStream, () => {
          openPopupCount -= 1;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_POPUP);
        });
      }

      if (processName === ENVIRONMENT_TYPE_SIDEPANEL) {
        sidePanelIsOpen = true;
        finished(portStream, () => {
          sidePanelIsOpen = false;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_SIDEPANEL);
        });
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true;

        finished(portStream, () => {
          notificationIsOpen = false;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_NOTIFICATION,
          );
        });
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id;
        openMetamaskTabsIDs[tabId] = true;

        finished(portStream, () => {
          delete openMetamaskTabsIDs[tabId];
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_FULLSCREEN,
          );
        });
      }
    } else if (
      senderUrl &&
      senderUrl.origin === phishingPageUrl.origin &&
      senderUrl.pathname === phishingPageUrl.pathname
    ) {
      const portStreamForPhishingPage =
        overrides?.getPortStream?.(remotePort) ||
        new ExtensionPortStream(remotePort, { chunkSize: 0 });
      controller.setupPhishingCommunication({
        connectionStream: portStreamForPhishingPage,
      });
    } else {
      // this is triggered when a new tab is opened, or origin(url) is changed
      if (remotePort.sender && remotePort.sender.tab && remotePort.sender.url) {
        const tabId = remotePort.sender.tab.id;
        const url = new URL(remotePort.sender.url);
        const { origin } = url;

        trackDappView(remotePort);

        remotePort.onMessage.addListener((msg) => {
          if (
            msg.data &&
            msg.data.method === MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS
          ) {
            requestAccountTabIds[origin] = tabId;
          }
        });
      }
      if (
        senderUrl &&
        COOKIE_ID_MARKETING_WHITELIST_ORIGINS.some(
          (origin) => origin === senderUrl.origin,
        )
      ) {
        const portStreamForCookieHandlerPage =
          overrides?.getPortStream?.(remotePort) ||
          new ExtensionPortStream(remotePort, { chunkSize: 0 });
        controller.setUpCookieHandlerCommunication({
          connectionStream: portStreamForCookieHandlerPage,
        });
      }

      const portStream =
        overrides?.getPortStream?.(remotePort) ||
        new ExtensionPortStream(remotePort, { chunkSize: 0 });

      connectEip1193(portStream, remotePort.sender);

      // for firefox and manifest v2 (non production webpack builds)
      // we expose the multichain provider via window.postMessage
      if (isFirefox || !isManifestV3) {
        const mux = setupMultiplex(portStream);
        mux.ignoreStream(METAMASK_EIP_1193_PROVIDER);

        connectCaipMultichain(
          mux.createStream(METAMASK_CAIP_MULTICHAIN_PROVIDER),
          remotePort.sender,
        );
      }
    }
  };

  connectExternallyConnectable = (remotePort) => {
    const portStream =
      overrides?.getPortStream?.(remotePort) ||
      new ExtensionPortStream(remotePort, { chunkSize: 0 });

    // if the sender.id value is present it means the caller is an extension rather
    // than a site. When the caller is an extension we want to fallback to connecting
    // it with the 1193 provider
    const isDappConnecting = !remotePort.sender.id;
    if (isDappConnecting) {
      if (metamaskBlockedPorts.includes(remotePort.name)) {
        return;
      }

      // this is triggered when a new tab is opened, or origin(url) is changed
      trackDappView(remotePort);

      connectCaipMultichain(createCaipStream(portStream), remotePort.sender);
    } else {
      connectEip1193(portStream, remotePort.sender);
    }
  };

  connectEip1193 = (connectionStream, sender) => {
    controller.setupUntrustedCommunicationEip1193({
      connectionStream,
      sender,
    });
  };

  connectCaipMultichain = (connectionStream, sender) => {
    controller.setupUntrustedCommunicationCaip({
      connectionStream,
      sender,
    });
  };

  if (overrides?.registerConnectListeners) {
    overrides.registerConnectListeners(
      connectWindowPostMessage,
      connectEip1193,
    );
  }

  //
  // User Interface setup
  //
  updateBadge();

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.DECRYPT_MESSAGE_MANAGER_UPDATE_BADGE,
    updateBadge,
  );
  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.ENCRYPTION_PUBLIC_KEY_MANAGER_UPDATE_BADGE,
    updateBadge,
  );
  controller.signatureController.hub.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.APP_STATE_UNLOCK_CHANGE,
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.APPROVAL_STATE_CHANGE,
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.METAMASK_NOTIFICATIONS_LIST_UPDATED,
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.METAMASK_NOTIFICATIONS_MARK_AS_READ,
    updateBadge,
  );

  /**
   * Formats a count for display as a badge label.
   *
   * @param {number} count - The count to be formatted.
   * @param {number} maxCount - The maximum count to display before using the '+' suffix.
   * @returns {string} The formatted badge label.
   */
  function getBadgeLabel(count, maxCount) {
    return count > maxCount ? `${maxCount}+` : String(count);
  }

  /**
   * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
   * The number reflects the current number of pending transactions or message signatures needing user approval.
   */
  function updateBadge() {
    const pendingApprovalCount = getPendingApprovalCount();

    let label = '';
    const badgeColor = BADGE_COLOR_APPROVAL;

    if (pendingApprovalCount) {
      label = getBadgeLabel(pendingApprovalCount, BADGE_MAX_COUNT);
    }

    try {
      const badgeText = { text: label };
      const badgeBackgroundColor = { color: badgeColor };

      if (isManifestV3) {
        browser.action.setBadgeText(badgeText);
        browser.action.setBadgeBackgroundColor(badgeBackgroundColor);
      } else {
        browser.browserAction.setBadgeText(badgeText);
        browser.browserAction.setBadgeBackgroundColor(badgeBackgroundColor);
      }
    } catch (error) {
      console.error('Error updating browser badge:', error);
    }
  }

  function getPendingApprovalCount() {
    try {
      const pendingApprovalCount =
        controller.appStateController.waitingForUnlock.length +
        controller.approvalController.getTotalApprovalCount();
      return pendingApprovalCount;
    } catch (error) {
      console.error('Failed to get pending approval count:', error);
      return 0;
    }
  }

  notificationManager.on(
    NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED,
    ({ automaticallyClosed }) => {
      if (!automaticallyClosed) {
        rejectUnapprovedNotifications();
      } else if (getPendingApprovalCount() > 0) {
        triggerUi();
      }

      updateBadge();
    },
  );

  function rejectUnapprovedNotifications() {
    controller.signatureController.rejectUnapproved(
      REJECT_NOTIFICATION_CLOSE_SIG,
    );
    controller.decryptMessageController.rejectUnapproved(
      REJECT_NOTIFICATION_CLOSE,
    );
    controller.encryptionPublicKeyController.rejectUnapproved(
      REJECT_NOTIFICATION_CLOSE,
    );

    controller.rejectAllPendingApprovals();
  }
}

//
// Etc...
//

/**
 * Opens the browser popup for user confirmation
 */
async function triggerUi() {
  const tabs = await platform.getActiveTabs();
  const currentlyActiveMetamaskTab = Boolean(
    tabs.find((tab) => openMetamaskTabsIDs[tab.id]),
  );
  // Vivaldi is not closing port connection on popup close, so openPopupCount does not work correctly
  // To be reviewed in the future if this behaviour is fixed - also the way we determine isVivaldi variable might change at some point
  const isVivaldi =
    tabs.length > 0 &&
    tabs[0].extData &&
    tabs[0].extData.indexOf('vivaldi_tab') > -1;
  if (
    !uiIsTriggering &&
    (isVivaldi || openPopupCount === 0) &&
    !currentlyActiveMetamaskTab &&
    !sidePanelIsOpen &&
    true
  ) {
    uiIsTriggering = true;
    try {
      const currentPopupId = controller.appStateController.getCurrentPopupId();
      await notificationManager.showPopup(
        (newPopupId) =>
          controller.appStateController.setCurrentPopupId(newPopupId),
        currentPopupId,
      );
    } finally {
      uiIsTriggering = false;
    }
  }
}

// It adds the "App Installed" event into a queue of events, which will be tracked only after a user opts into metrics.
const addAppInstalledEvent = () => {
  if (controller) {
    controller.metaMetricsController.updateTraits({
      [MetaMetricsUserTrait.InstallDateExt]: new Date()
        .toISOString()
        .split('T')[0], // yyyy-mm-dd
    });
    controller.metaMetricsController.addEventBeforeMetricsOptIn({
      category: MetaMetricsEventCategory.App,
      event: MetaMetricsEventName.AppInstalled,
      properties: {},
    });
    return;
  }
  setTimeout(() => {
    // If the controller is not set yet, we wait and try to add the "App Installed" event again.
    addAppInstalledEvent();
  }, 500);
};

/**
 * Handles the onInstalled event.
 *
 * @param {[chrome.runtime.InstalledDetails]} params - Array containing a single installation details object.
 */
async function handleOnInstalled([details]) {
  if (details.reason === 'install') {
    onInstall();
  } else if (details.reason === 'update') {
    const { previousVersion } = details;
    if (!previousVersion || previousVersion === platform.getVersion()) {
      return;
    }
    await isInitialized;
    onUpdate(controller, platform, previousVersion, requestSafeReload);
  }
}

/**
 * Trigger actions that should happen only upon initial install (e.g. open tab for onboarding).
 */
function onInstall() {
  log.debug('First install detected');
  addAppInstalledEvent();
  if (!process.env.IN_TEST && !process.env.METAMASK_DEBUG) {
    platform.openExtensionInBrowser();
  }
}

/**
 * Trigger actions that should happen only when an update is available
 */
async function onUpdateAvailable() {
  await isInitialized;
  log.debug('An update is available');
  controller.appStateController.setIsUpdateAvailable(true);
}

browser.runtime.onUpdateAvailable.addListener(onUpdateAvailable);

function onNavigateToTab() {
  browser.tabs.onActivated.addListener((onActivatedTab) => {
    if (controller) {
      const { tabId } = onActivatedTab;
      const currentOrigin = senderOriginMapping[tabId];
      const currentTabOrigin = tabOriginMapping[tabId];
      // *** Emit DappViewed metric event when ***
      // - navigate to a connected dapp
      if (currentOrigin) {
        const connectSitePermissions =
          controller.permissionController.state.subjects[currentOrigin];
        // when the dapp is not connected, connectSitePermissions is undefined
        const isConnectedToDapp = connectSitePermissions !== undefined;
        if (isConnectedToDapp) {
          emitDappViewedMetricEvent(currentOrigin);
        }
      }

      // If the connected dApp is Hyperliquid, trigger the referral flow
      if (currentTabOrigin === HYPERLIQUID_ORIGIN) {
        const connectSitePermissions =
          controller.permissionController.state.subjects[currentTabOrigin];
        // when the dapp is not connected, connectSitePermissions is undefined
        const isConnectedToDapp = connectSitePermissions !== undefined;
        if (isConnectedToDapp) {
          controller
            .handleHyperliquidReferral(
              tabId,
              HyperliquidPermissionTriggerType.OnNavigateConnectedTab,
            )
            .catch((error) => {
              log.error(
                'Failed to handle Hyperliquid referral after navigation to connected tab: ',
                error,
              );
            });
        }
      }
    }
  });
}

// Sidepanel-specific functionality
// Set initial side panel behavior based on user preference
const initSidePanelBehavior = async () => {
  // Only initialize sidepanel behavior if the feature flag is enabled
  // and the browser supports the sidePanel API (not Firefox)
  if (process.env.IS_SIDEPANEL?.toString() !== 'true' || !browser?.sidePanel) {
    return;
  }

  try {
    // Wait for controller to be initialized
    await isInitialized;

    // Get user preference (default to false for side panel)
    const useSidePanelAsDefault =
      controller?.preferencesController?.state?.preferences
        ?.useSidePanelAsDefault ?? false;

    // Set panel behavior based on preference
    if (browser?.sidePanel?.setPanelBehavior) {
      await browser.sidePanel.setPanelBehavior({
        openPanelOnActionClick: useSidePanelAsDefault,
      });
    }
  } catch (error) {
    console.error('Error setting side panel behavior:', error);
  }
};

initSidePanelBehavior();

// Listen for preference changes to update side panel behavior dynamically
const setupPreferenceListener = async () => {
  // Only setup preference listener if the feature flag is enabled
  // and the browser supports the sidePanel API (not Firefox)
  if (process.env.IS_SIDEPANEL?.toString() !== 'true' || !browser?.sidePanel) {
    return;
  }

  try {
    await isInitialized;

    // Listen for preference changes using the controller messenger
    controller?.controllerMessenger?.subscribe(
      'PreferencesController:stateChange',
      (state) => {
        const useSidePanelAsDefault =
          state?.preferences?.useSidePanelAsDefault ?? false;

        if (browser?.sidePanel?.setPanelBehavior) {
          browser.sidePanel
            .setPanelBehavior({
              openPanelOnActionClick: useSidePanelAsDefault,
            })
            .catch((error) =>
              console.error('Error updating panel behavior:', error),
            );
        }
      },
    );
  } catch (error) {
    console.error('Error setting up preference listener:', error);
  }
};

setupPreferenceListener();

// Tab listeners to populate appActiveTab
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  // Wait for controller to be initialized
  await isInitialized;
  if (!controller) {
    return {};
  }

  try {
    const tabInfo = await browser.tabs.get(tabId);
    const { id, title, url, favIconUrl } = tabInfo;

    if (!url) {
      return {};
    }

    const { origin, protocol, host, href } = new URL(url);

    // Skip if no origin, null origin, or extension pages
    if (
      !origin ||
      origin === 'null' ||
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('moz-extension://')
    ) {
      return {};
    }

    // Update the app active tab state
    controller.appStateController.setAppActiveTab({
      id,
      title,
      origin,
      protocol,
      url,
      host,
      href,
      favIconUrl,
    });

    // Update subject metadata for permission system
    controller.subjectMetadataController.addSubjectMetadata({
      origin,
      name: title || host || origin,
      iconUrl: favIconUrl || null,
      subjectType: 'website',
    });
  } catch (error) {
    // Ignore errors from tabs that don't exist or can't be accessed
    console.log('Error in tabs.onActivated listener:', error.message);
  }

  return {};
});

browser.tabs.onUpdated.addListener(async (tabId) => {
  // Wait for controller to be initialized
  await isInitialized;
  if (!controller) {
    return {};
  }

  try {
    const tabInfo = await browser.tabs.get(tabId);
    const { id, title, url, favIconUrl } = tabInfo;

    if (!url) {
      return {};
    }

    const { origin, protocol, host, href } = new URL(url);

    // Skip if no origin, null origin, or extension pages
    if (
      !origin ||
      origin === 'null' ||
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('moz-extension://')
    ) {
      return {};
    }

    // Update the app active tab state
    controller.appStateController.setAppActiveTab({
      id,
      title,
      origin,
      protocol,
      url,
      host,
      href,
      favIconUrl,
    });

    // Update subject metadata for permission system
    controller.subjectMetadataController.addSubjectMetadata({
      origin,
      name: title || host || origin,
      iconUrl: favIconUrl || null,
      subjectType: 'website',
    });
  } catch (error) {
    // Ignore errors from tabs that don't exist or can't be accessed
    console.log('Error in tabs.onUpdated listener:', error.message);
  }

  return {};
});

function setupSentryGetStateGlobal(store) {
  global.stateHooks.getSentryAppState = function () {
    const backgroundState = store.memStore.getState();
    return maskObject(backgroundState, SENTRY_BACKGROUND_STATE);
  };
}

/**
 *
 * @param {Backup | null} backup
 */
async function initBackground(backup) {
  onNavigateToTab();
  try {
    await initialize(backup);
    if (process.env.IN_TEST) {
      // Send message to offscreen document
      if (browser.offscreen) {
        browser.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.metamaskBackgroundReady,
        });
      } else {
        window.document?.documentElement?.classList.add('controller-loaded');
      }
    }
    persistenceManager.cleanUpMostRecentRetrievedState();

    log.info('MetaMask initialization complete.');
    resolveInitialization();
  } catch (error) {
    log.error(error);
    rejectInitialization(error);
  }
}
if (!process.env.SKIP_BACKGROUND_INITIALIZATION) {
  initBackground(null);
}
