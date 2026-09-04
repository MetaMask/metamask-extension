/**
 * @file The entry point for the web extension singleton process.
 */

// Disabled to allow setting up initial state hooks first

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
// eslint-disable-next-line import-x/order -- intentional first import for Sentry
import { persistenceManager } from './lib/setup-initial-state-hooks';

// Import this very early, so globalThis.INFURA_PROJECT_ID_FROM_MANIFEST_FLAGS is always defined
import '../../shared/constants/infura-project-id';

import { lightTheme } from '@metamask/design-tokens';
import { finished } from 'readable-stream';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import { isObject } from '@metamask/utils';
import { deriveStateFromMetadata } from '@metamask/base-controller';
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
import { AccountOverviewTabKey } from '../../shared/constants/app-state';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import {
  BACKGROUND_LIVENESS_METHOD,
  BACKGROUND_INITIALIZED_METHOD,
} from '../../shared/constants/ui-initialization';
import {
  REJECT_NOTIFICATION_CLOSE,
  REJECT_NOTIFICATION_CLOSE_SIG,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../shared/constants/metametrics';
import {
  getActiveTabDomainAllowlist,
  getActiveTabDomainForMetrics,
} from '../../shared/lib/active-tab-domain-metrics';
import { checkForLastErrorAndLog } from '../../shared/lib/browser-runtime.utils';
import { isManifestV3 } from '../../shared/lib/mv3.utils';
import { maskObject } from '../../shared/lib/object.utils';
import {
  OffscreenCommunicationTarget,
  OffscreenCommunicationEvents,
} from '../../shared/constants/offscreen-communication';
import { captureException } from '../../shared/lib/sentry';
import { getCurrentChainId } from '../../shared/lib/selectors/networks';
import { createCaipStream } from '../../shared/lib/caip-stream';
import getFetchWithTimeout from '../../shared/lib/fetch-with-timeout';
import { isStateCorruptionError } from '../../shared/constants/errors';
import getFirstPreferredLangCode from '../../shared/lib/get-first-preferred-lang-code';
import { getManifestFlags } from '../../shared/lib/manifestFlags';
import { DISPLAY_GENERAL_STARTUP_ERROR } from '../../shared/constants/start-up-errors';
import { getPartnerByOrigin } from '../../shared/constants/defi-referrals';
import {
  createEvent,
  shouldTrackDeepLinkNavigation,
} from '../../shared/lib/deep-links/metrics';
import {
  backedUpStateKeys,
  hasVault,
} from '../../shared/lib/stores/persistence-manager';
import { getAttentionRequiredApprovalCount } from './lib/approval/utils';
import { CorruptionHandler } from './lib/state-corruption/state-corruption-recovery';
import { CriticalErrorHandler } from './lib/critical-error/critical-error-recovery';
import { setupLedgerModeOffscreenBridge } from './lib/offscreen-bridge/ledger-mode-offscreen-bridge';
import {
  isPhishingWarningPageUrl,
  loadPhishingWarningPage,
  maybeDetectPhishing,
} from './lib/phishing';
import { updateRemoteFeatureFlags } from './lib/update-remote-feature-flags';
import ExtensionPlatform from './platforms/extension';
import { SENTRY_BACKGROUND_STATE } from './constants/sentry-state';

import NotificationManager, {
  NOTIFICATION_MANAGER_EVENTS,
} from './lib/notification-manager';
import MetamaskController, {
  METAMASK_CONTROLLER_EVENTS,
} from './metamask-controller';
import { createEventBuilder, trackEvent } from './controllers/analytics';
import setupEnsIpfsResolver from './lib/ens-ipfs/setup';
import {
  getPlatform,
  initInstallType,
  isWebOrigin,
  shouldEmitDappViewedEvent,
} from './lib/util';
import { createOffscreen, addOffscreenConnectivityListener } from './offscreen';
import { setupMultiplex } from './lib/stream-utils';
import rawFirstTimeState from './first-time-state';
import { loadStateFromPersistence } from './lib/startup/load-state-from-persistence';
import {
  handleOnInstalled,
  onUpdateAvailable,
} from './lib/lifecycle/install-lifecycle';

import { COOKIE_ID_MARKETING_WHITELIST_ORIGINS } from './constants/marketing-site-whitelist';
import {
  METAMASK_CAIP_MULTICHAIN_PROVIDER,
  METAMASK_EIP_1193_PROVIDER,
} from './constants/stream';
import { PREINSTALLED_SNAPS_URLS } from './constants/snaps';
import { ExtensionLazyListener } from './lib/extension-lazy-listener/extension-lazy-listener';
import { DeepLinkRouter } from './lib/deep-links/deep-link-router';
import { getRequestSafeReload } from './lib/safe-reload';
import {
  readCriticalErrorRestoreSession,
  clearCriticalErrorRestoreSession,
  handoffRestoringTabToExtension,
  openRestoringTabAndReload,
} from './lib/critical-error/critical-error-tab-handoff';
import { requestRepair } from './lib/repair';
import {
  createSidepanelOpener,
  setupSidePanelToolbarBehavior,
  shouldUseSidepanel,
} from './sidepanel/background';
import { tryPostMessage } from './lib/start-up-errors/start-up-errors';
import { CronjobControllerStorageManager } from './lib/CronjobControllerStorageManager';
import { ReferralTriggerType } from './lib/defi-referrals/createDefiReferralMiddleware';
import { getIframeProperties } from './lib/getIframeProperties';
import { BLOCKED_HOSTNAMES, BLOCKED_PORTS } from './constants/background';

/**
 * @typedef {import('../../shared/lib/stores/persistence-manager').Backup} Backup
 */

// MV3 configures the ExtensionLazyListener in service-worker.ts and sets it on globalThis.stateHooks,
// but in MV2 we don't need to do that, so we create it here (and we don't add any lazy listeners,
// as it doesn't need them).
const lazyListener =
  globalThis.stateHooks.lazyListener ?? new ExtensionLazyListener(browser);

// eslint-disable-next-line @metamask/design-tokens/color-no-hex
const BADGE_COLOR_APPROVAL = '#0376C9';
const BADGE_COLOR_FAILED = lightTheme.colors.error.default;
const BADGE_MAX_COUNT = 9;
const maxSeenFailedNonces = 99;

const VAULT_AT_STARTUP_TEST_WINDOW_MS = 60_000;

/**
 * Whether backup fetch saw a vault at startup less than {@link VAULT_AT_STARTUP_TEST_WINDOW_MS} ago.
 *
 * @param {number | null | undefined} hasVaultAtStartup - Timestamp when backup fetch saw a vault, or nullish.
 * @returns {boolean}
 */
function hadVaultAtStartupRecently(hasVaultAtStartup) {
  if (typeof hasVaultAtStartup !== 'number') {
    return false;
  }
  return Date.now() - hasVaultAtStartup < VAULT_AT_STARTUP_TEST_WINDOW_MS;
}

/**
 * Test-only state shared across startup and later port handling (hang simulations).
 * `null` in production builds so we do not keep loose mutable test globals.
 */
const inTestState = process.env.IN_TEST
  ? { restoreInProgress: false, hasVaultAtStartup: null }
  : null;

const { safePersist, requestSafeReload, evacuate } =
  getRequestSafeReload(persistenceManager);

// Setup global hook for improved Sentry state snapshots during initialization
global.stateHooks.getMostRecentPersistedState = () =>
  persistenceManager.mostRecentRetrievedState;

// Expose storageKind for Sentry tagging (used to distinguish 'data' vs 'split' storage)
global.stateHooks.getStorageKind = () => persistenceManager.storageKind;

/**
 * A helper function to log the current state of the vault. Useful for debugging
 * purposes, to, in the case of storage errors, a possible way for an end
 * user to recover their vault. Hopefully this is never needed.
 */
global.logEncryptedVault = () => {
  persistenceManager.logEncryptedVault();
};

const { sentry } = global;

const metamaskInternalProcessHash = {
  [ENVIRONMENT_TYPE_POPUP]: true,
  [ENVIRONMENT_TYPE_NOTIFICATION]: true,
  [ENVIRONMENT_TYPE_FULLSCREEN]: true,
};

log.setLevel(process.env.METAMASK_DEBUG ? 'debug' : 'info', false);

const platform = new ExtensionPlatform();
const notificationManager = new NotificationManager();
const isFirefox = getPlatform() === PLATFORM_FIREFOX;

/**
 * Parses port connection info for routing decisions.
 * Determines if the port is from the MetaMask UI (popup, notification, fullscreen)
 * vs a contentscript injected into a regular web page.
 *
 * @param {browser.Runtime.Port} port - The port to parse.
 * @returns {{ processName: string, senderUrl: URL | null, isMetaMaskUIPort: boolean }} Parsed port info.
 */
function parsePortInfo(port) {
  const processName = port.name;
  const senderUrl = port.sender?.url ? new URL(port.sender.url) : null;

  let isMetaMaskUIPort;
  if (isFirefox) {
    isMetaMaskUIPort = Boolean(metamaskInternalProcessHash[processName]);
  } else {
    isMetaMaskUIPort =
      senderUrl?.origin === `chrome-extension://${browser.runtime.id}`;
  }

  return { processName, senderUrl, isMetaMaskUIPort };
}

let openPopupCount = 0;
let notificationIsOpen = false;
let uiIsTriggering = false;
let openSidePanelCount = 0;
let failedTxCount = 0;
const seenFailedNonces = new Set();
const openMetamaskTabsIDs = {};
const requestAccountTabIds = {};
let controller;
const senderOriginMapping = {};
const tabOriginMapping = {};
const frameIdMapping = {};

const requestOpenSidepanel = createSidepanelOpener();

if (process.env.IN_TEST || process.env.METAMASK_DEBUG) {
  global.stateHooks.metamaskGetState = persistenceManager.get.bind(
    persistenceManager,
    { validateVault: false },
  );
}

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
 * Install/update lifecycle dependencies. `controller` is accessed via a getter
 * because `onInstalled` can fire (and be buffered) before `controller` is assigned.
 *
 * @returns {import('./lib/lifecycle/install-lifecycle').InstallLifecycleDependencies}
 */
function getInstallLifecycleDeps() {
  return {
    get controller() {
      return controller;
    },
    platform,
    isInitialized,
    requestSafeReload,
  };
}

lazyListener.once('runtime', 'onInstalled').then((details) => {
  handleOnInstalled(details, getInstallLifecycleDeps());
});

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
const criticalErrorHandler = new CriticalErrorHandler();
/**
 * Handles the onConnect event.
 *
 * @param {browser.Runtime.Port} port - The port provided by a new context.
 */
const handleOnConnect = async (port) => {
  const { isMetaMaskUIPort } = parsePortInfo(port);
  if (process.env.IN_TEST) {
    const simulatedDelay =
      getManifestFlags().testing?.simulateDelayedBackgroundResponse;
    if (simulatedDelay === true) {
      return;
    } else if (typeof simulatedDelay === 'number') {
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
    } else if (simulatedDelay !== undefined) {
      log.error(
        `Unrecognized value for 'simulateDelayedBackgroundResponse': '${simulatedDelay}'`,
      );
    }
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

  let removeCriticalErrorListeners;
  if (isMetaMaskUIPort) {
    criticalErrorHandler.registerPortForCriticalError({
      port,
      repairCallback: () =>
        requestRepair(() => openRestoringTabAndReload(requestSafeReload)),
    });
    removeCriticalErrorListeners = () =>
      criticalErrorHandler.removeListenersForPort(port);
  }

  // Queue up connection attempts here, waiting until after initialization
  try {
    await isInitialized;

    // Notify UI that background initialization is complete, before sending state.
    // This is sent on the raw port (like ALIVE) so the UI can distinguish between
    // "background still initializing" vs "background initialized but state sync failed".
    // Only MetaMask UI ports listen for this message (contentscripts do not).
    if (isMetaMaskUIPort) {
      if (!tryPostMessage(port, BACKGROUND_INITIALIZED_METHOD)) {
        return;
      }
    }

    // For testing: skip connectWindowPostMessage to simulate state sync hang.
    // Only when backup pre-existed at startup (i.e. after a runtime.reload(),
    // not during the initial onboarding session) and we're not in the restore
    // flow (so recovery can complete).
    if (
      process.env.IN_TEST &&
      getManifestFlags().testing?.simulateBackgroundStateSyncHang &&
      !inTestState?.restoreInProgress &&
      hadVaultAtStartupRecently(inTestState.hasVaultAtStartup)
    ) {
      return;
    }

    // This is set in `setupController`, which is called as part of initialization
    connectWindowPostMessage(port, removeCriticalErrorListeners);
  } catch (error) {
    try {
      sentry?.captureException(error);

      // Only handle errors for MetaMask UI connections (popup, notification, fullscreen),
      // not for contentscripts injected into regular web pages.
      // Contentscripts can't display error screens and would create hanging promises.
      if (isMetaMaskUIPort) {
        // If we have a STATE_CORRUPTION_ERROR tell the user about it and offer to
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
          // General errors
          const errorLike = isObject(error)
            ? {
                message: error.message ?? 'Unknown error',
                name: error.name ?? 'UnknownError',
                stack: error.stack,
                // Preserve sentryTags for searchable/filterable fields in Sentry UI
                ...(error.sentryTags && { sentryTags: error.sentryTags }),
              }
            : {
                message: String(error),
                name: 'UnknownError',
                stack: '',
              };
          tryPostMessage(port, DISPLAY_GENERAL_STARTUP_ERROR, {
            error: errorLike,
            currentLocale:
              controller?.preferencesController?.state?.currentLocale,
          });
        }
      }
    } finally {
      removeCriticalErrorListeners?.();
    }
  }
};
const installOnConnectListener = () => {
  lazyListener.addListener('runtime', 'onConnect', handleOnConnect);
};
if (
  process.env.IN_TEST &&
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

/**
 * @typedef {import('@metamask/transaction-controller').TransactionMeta} TransactionMeta
 */

/**
 * The data emitted from the MetaMaskController.store EventEmitter, also used to initialize the MetaMaskController. Available in UI on React state as state.metamask.
 *
 * @typedef MetaMaskState
 * @property {boolean} isInitialized - Whether the first vault has been created.
 * @property {boolean} isUnlocked - Whether the vault is currently decrypted and accounts are available for selection.
 * @property {boolean} isNetworkMenuOpen - Represents whether the main network selection UI is currently displayed.
 * @property {object} identities - An object matching lower-case hex addresses to Identity objects with "address" and "name" (nickname) keys.
 * @property {object} networkConfigurations - A list of network configurations, containing RPC provider details (eg chainId, rpcUrl, rpcPreferences).
 * @property {Array} addressBook - A list of previously sent to addresses.
 * @property {object} marketData - A map from chain ID -> contract address -> an object containing the token's market data.
 * @property {Array} tokens - Tokens held by the current user, including their balances.
 * @property {object} send - TODO: Document
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
  // Initialize install type early so it's cached for MetaMetrics user traits
  // This is fire-and-forget - we don't await it to avoid blocking initialization
  initInstallType();

  const offscreenPromise = isManifestV3 ? createOffscreen() : null;

  // Set up connectivity listener IMMEDIATELY for MV3 (before any awaits)
  // This ensures we capture the initial connectivity status from the offscreen document
  // which is sent right after isBooted. We queue the status until the controller is ready.
  let pendingConnectivityStatus = null;
  let connectivityReady = false;

  if (isManifestV3) {
    addOffscreenConnectivityListener((isOnline) => {
      if (connectivityReady && controller.connectivityAdapter) {
        const status = isOnline ? 'online' : 'offline';
        controller.connectivityAdapter.setStatus(status);
      } else {
        // Queue until controller is ready
        pendingConnectivityStatus = isOnline;
      }
    });
  }

  const { versionedData: initData } = await loadStateFromPersistence(backup, {
    ...rawFirstTimeState,
  });

  const initState = initData.data;
  const initLangCode = await getFirstPreferredLangCode();

  let isFirstMetaMaskControllerSetup;

  // We only want to start this if we are running a test build, not for the release build.
  // `navigator.webdriver` is true if Selenium, Puppeteer, or Playwright are running.
  // In MV3, the Service Worker sees `navigator.webdriver` as `undefined`, so this will trigger from
  // an Offscreen Document message instead. Because it's a singleton class, it's safe to start multiple times.
  if (process.env.IN_TEST && window.navigator?.webdriver) {
    const { getSocketBackgroundToMocha } =
      // Load conditionally so this test-only code can be dead-code-eliminated from production builds.
      // eslint-disable-next-line n/global-require
      require('../../test/e2e/background-socket/socket-background-to-mocha');
    getSocketBackgroundToMocha();
  }

  if (isManifestV3) {
    const sessionData = await browser.storage.session.get([
      'isFirstMetaMaskControllerSetup',
    ]);

    isFirstMetaMaskControllerSetup =
      sessionData?.isFirstMetaMaskControllerSetup === undefined;
    await browser.storage.session.set({ isFirstMetaMaskControllerSetup });
  }

  const preinstalledSnaps = await loadPreinstalledSnaps();
  const cronjobControllerStorageManager = new CronjobControllerStorageManager();
  await cronjobControllerStorageManager.init();

  setupController(
    initState,
    initLangCode,
    isFirstMetaMaskControllerSetup,
    initData.meta,
    offscreenPromise,
    preinstalledSnaps,
    cronjobControllerStorageManager,
  );

  setupLedgerModeOffscreenBridge(controller, offscreenPromise);

  controller.metaMetricsController.updateTraits({
    [MetaMetricsUserTrait.StorageKind]: persistenceManager.storageKind,
  });

  // `setupController` sets up the `controller` object, so we can use it now:
  maybeDetectPhishing(controller);

  // Set up connectivity detection
  if (isManifestV3) {
    // MV3: Listener was set up earlier, now apply any pending status and mark ready
    connectivityReady = true;
    if (pendingConnectivityStatus !== null) {
      const status = pendingConnectivityStatus ? 'online' : 'offline';
      controller.connectivityAdapter.setStatus(status);
    }
  } else {
    // MV2: Background page has access to window events
    const updateConnectivity = (isOnline) => {
      const status = isOnline ? 'online' : 'offline';
      controller.connectivityAdapter.setStatus(status);
    };
    updateConnectivity(globalThis.navigator.onLine);
    globalThis.addEventListener('online', () => updateConnectivity(true));
    globalThis.addEventListener('offline', () => updateConnectivity(false));
  }

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
      if (shouldTrackDeepLinkNavigation(parsed)) {
        trackEvent(createEvent({ signature: parsed.signature, url }));
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
 * Emit event of DappViewed,
 * which should only be tracked only after a user opts into metrics and connected to the dapp
 *
 * @param {string} origin - URL of visited dapp
 * @param {string} [mainFrameOrigin] - The top-level frame origin (if sender is an iframe, this differs from origin)
 * @param {number} [frameId] - The frame ID from chrome.runtime.MessageSender (0 = top-level, >0 = iframe)
 */
function emitDappViewedMetricEvent(origin, mainFrameOrigin, frameId) {
  const { analyticsId } = controller.getState();
  if (!shouldEmitDappViewedEvent(analyticsId)) {
    return;
  }

  const numberOfConnectedAccounts =
    controller.getPermittedAccounts(origin).length;
  if (numberOfConnectedAccounts === 0) {
    return;
  }

  const accountsState = controller.controllerMessenger.call(
    'AccountsController:getState',
  );
  const numberOfTotalAccounts = Object.keys(
    accountsState.internalAccounts.accounts,
  ).length;

  const iframeProps = getIframeProperties({ frameId, origin, mainFrameOrigin });

  trackEvent(
    createEventBuilder(MetaMetricsEventName.DappViewed)
      .addCategory(MetaMetricsEventCategory.InpageProvider)
      .addProperties({
        is_first_visit: false,
        number_of_accounts: numberOfTotalAccounts,
        number_of_accounts_connected: numberOfConnectedAccounts,
        ...iframeProps,
      })
      .build({
        referrer: {
          url: origin,
        },
        excludeMetaMetricsId: true,
      }),
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
  const { frameId } = remotePort.sender;

  // store the origin to corresponding tab so it can provide info for onActivated listener
  if (!Object.keys(senderOriginMapping).includes(tabId)) {
    senderOriginMapping[tabId] = origin;
  }
  // do the same for tab origin, which can be different to sender origin
  if (!(tabId in tabOriginMapping)) {
    tabOriginMapping[tabId] = tabOrigin;
  }
  if (!(tabId in frameIdMapping)) {
    frameIdMapping[tabId] = frameId;
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
    emitDappViewedMetricEvent(origin, tabOrigin, frameId);
  }
}

/**
 * Emit App Opened event
 *
 * @param {string} environmentType - The environment type where the app is opening
 */
function emitAppOpenedMetricEvent(environmentType) {
  const { consentDecisionMade, optedIn } = controller.getState();

  // Skip if user hasn't opted into metrics
  if (!consentDecisionMade || !optedIn) {
    return;
  }

  const activeTabOrigin =
    controller.appStateController.state.appActiveTab?.origin;
  const allowlist = getActiveTabDomainAllowlist(
    controller.remoteFeatureFlagController.state,
  );
  const activeTabDomain = getActiveTabDomainForMetrics(
    activeTabOrigin,
    allowlist,
  );

  trackEvent(
    createEventBuilder(MetaMetricsEventName.AppOpened)
      .addCategory(MetaMetricsEventCategory.App)
      .addProperties(
        activeTabDomain ? { active_tab_domain: activeTabDomain } : {},
      )
      .build({ environmentType }),
  );
}

/**
 * Returns true if the App Opened metric event should fire for the given env.
 *
 * @param {string} environment - The environment type where the app is opening
 * @returns {boolean}
 */
function shouldEmitAppOpened(environment) {
  // List of valid environment types to track
  const environmentTypeList = [
    ENVIRONMENT_TYPE_POPUP,
    ENVIRONMENT_TYPE_NOTIFICATION,
    ENVIRONMENT_TYPE_FULLSCREEN,
    ENVIRONMENT_TYPE_SIDEPANEL,
  ];

  // Check if any UI instances are currently open
  const isFullscreenOpen = Object.values(openMetamaskTabsIDs).some(Boolean);
  const isAlreadyOpen =
    isFullscreenOpen ||
    notificationIsOpen ||
    openPopupCount > 0 ||
    openSidePanelCount > 0;

  // Only emit event if no UI is open and environment is valid
  return !isAlreadyOpen && environmentTypeList.includes(environment);
}

/**
 * This function checks if the app is being opened
 * and emits an event only if no other UI instances are currently open.
 *
 * @param {string} environment - The environment type where the app is opening
 */
function trackAppOpened(environment) {
  if (shouldEmitAppOpened(environment)) {
    emitAppOpenedMetricEvent(environment);
  }
}

/**
 * Helper function to refresh appActiveTab by querying the current active tab.
 * This is used when the sidepanel opens to ensure it has the current tab info,
 * and when the focused window changes to keep appActiveTab in sync.
 *
 * @param {number} [windowId] - If provided, queries the active tab in this
 * specific window. Otherwise queries the active tab in the current window.
 */
const refreshAppActiveTab = async (windowId) => {
  await isInitialized;
  if (!controller) {
    return;
  }

  try {
    const queryOptions = windowId
      ? { active: true, windowId }
      : { active: true, currentWindow: true };

    const tabs = await browser.tabs.query(queryOptions);
    if (!tabs || tabs.length === 0) {
      return;
    }

    const activeTab = tabs[0];
    const { id, title, url, favIconUrl } = activeTab;

    if (!url) {
      // Clear appActiveTab when there's no URL (e.g., new blank tab)
      controller.appStateController.clearAppActiveTab();
      return;
    }

    const { origin, protocol, host, href } = new URL(url);

    if (!isWebOrigin(origin)) {
      // Clear appActiveTab for non-web pages (chrome://, about:, extensions, etc.)
      controller.appStateController.clearAppActiveTab();
      return;
    }

    // Update appActiveTab with current active tab info
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
    console.log('Error refreshing appActiveTab:', error.message);
  }
};

/**
 * Initializes the MetaMask Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {string} initLangCode - The region code for the language preferred by the current user.
 * @param isFirstMetaMaskControllerSetup
 * @param {object} stateMetadata - Metadata about the initial state and migrations, including the most recent migration version
 * @param {Promise<void>} offscreenPromise - A promise that resolves when the offscreen document has finished initialization.
 * @param {Array} preinstalledSnaps - A list of preinstalled Snaps loaded from disk during boot.
 * @param {CronjobControllerStorageManager} cronjobControllerStorageManager - A storage manager for the CronjobController.
 */
export function setupController(
  initState,
  initLangCode,
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
    isFirstMetaMaskControllerSetup,
    currentMigrationVersion: stateMetadata.version,
    featureFlags: {},
    offscreenPromise,
    preinstalledSnaps,
    requestSafeReload,
    cronjobControllerStorageManager,
  });

  // Wire up the callback to notify the UI when set operations fail
  persistenceManager.setOnSetFailed((errorType) => {
    controller.appStateController.setStorageWriteErrorType(errorType);
  });

  /**
   * @type {Array<string>} List of controller store keys that have changed since initialization.
   */
  const changedControllerKeys = [];
  const currentState = controller.store.getState();
  for (const key of Object.keys(currentState)) {
    const initialControllerState = initState[key] || {};
    const newControllerState = currentState[key];
    if (newControllerState === null || typeof newControllerState !== 'object') {
      captureException(
        new Error(
          `Invalid controller state for '${key}' of type '${newControllerState === null ? 'null' : typeof newControllerState}'`,
        ),
      );
      continue;
    }
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

  if (persistenceManager.storageKind === 'split') {
    if (changedControllerKeys.length > 0) {
      log.info(
        `MetaMaskController state changed during configuration for controllers: ${changedControllerKeys.join(', ')}. Persisting updated state.`,
      );
      // update the new state
      changedControllerKeys.forEach((key) => {
        persistenceManager.update(key, currentState[key]);
      });
      // then persist it
      safePersist().catch((error) => {
        log.error('Error persisting updated state:', error);
        sentry?.captureException(error);
      });
    }

    controller.store.on(
      'stateChange',
      async ({ controllerKey, newState, _oldState, _patches }) => {
        persistenceManager.update(controllerKey, newState);

        // if this key is one of the `backedUpStateKeys` we must always
        // re-persist all of the other `backedUpStateKeys`, as they must always
        // stored in the backup DB together.
        if (backedUpStateKeys.includes(controllerKey)) {
          backedUpStateKeys.forEach((key) => {
            if (key === controllerKey) {
              // already updated this one
              return;
            }
            // Get the state for this backed-up key using messenger.
            // We filter to only persistent properties using deriveStateFromMetadata
            // to match what ComposableObservableStore does in stateChange events.
            // This ensures non-persistent properties (e.g., KeyringController's
            // isUnlocked, keyrings, encryptionKey) are not written to storage.
            const controllerConfig = controller.store.config[key];
            if (!controllerConfig?.metadata) {
              throw new Error(
                `Cannot backup ${key}: controller metadata is required but not found. ` +
                  `All controllers in backedUpStateKeys must extend BaseController and define metadata.`,
              );
            }
            const fullState = controller.controllerMessenger.call(
              `${key}:getState`,
            );
            const state = deriveStateFromMetadata(
              fullState,
              controllerConfig.metadata,
              'persist',
            );
            persistenceManager.update(key, state);
          });
        }
        try {
          await safePersist();
        } catch (error) {
          log.error('Error persisting state change:', error);
          sentry?.captureException(error);
        }
      },
    );
  } else {
    if (changedControllerKeys.length > 0) {
      log.info(
        `MetaMaskController state changed during configuration for controllers: ${changedControllerKeys.join(', ')}. Persisting updated state.`,
      );
      // persist the new state
      safePersist(currentState).catch((error) => {
        log.error('Error persisting updated controller state:', error);
        sentry?.captureException(error);
      });
    }
    controller.store.on('update', safePersist);
  }
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
      openSidePanelCount > 0 ||
      false
    );
  };

  const hasPersistentUiOpen = () => {
    return openPopupCount > 0 || openSidePanelCount > 0;
  };

  const isOnlyNotificationOpen = () => {
    return notificationIsOpen && !hasPersistentUiOpen();
  };

  const onCloseEnvironmentInstances = (isClientOpen, environmentType) => {
    // if all instances of metamask are closed we call a method on the controller to stop gasFeeController polling
    if (isClientOpen === false) {
      controller.onClientClosed();
      // otherwise we want to only remove the polling tokens for the environment type that has closed
    } else {
      // In fullscreen and sidepanel environments, users can have multiple instances
      // open at once, so we only disconnect tokens when the last instance closes.
      if (
        (environmentType === ENVIRONMENT_TYPE_FULLSCREEN &&
          Boolean(Object.keys(openMetamaskTabsIDs).length)) ||
        (environmentType === ENVIRONMENT_TYPE_SIDEPANEL &&
          openSidePanelCount > 0)
      ) {
        return;
      }
      controller.onEnvironmentTypeClosed(environmentType);
    }
  };

  connectWindowPostMessage = (remotePort, removeCriticalErrorListeners) => {
    if (BLOCKED_PORTS.includes(remotePort.name)) {
      return;
    }

    const { processName, senderUrl, isMetaMaskUIPort } =
      parsePortInfo(remotePort);

    if (isMetaMaskUIPort) {
      /**
       * @type {ExtensionPortStream}
       */
      const portStream = new ExtensionPortStream(remotePort);

      /**
       * send event to sentry with details about the event
       *
       * @param {import("extension-port-stream").MessageTooLargeEventData} details
       */
      const handleMessageTooLarge = function ({ chunkSize }) {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.PortStreamChunked)
            .addCategory(MetaMetricsEventCategory.PortStream)
            .addProperties({ chunkSize })
            .build(),
        );
      };
      remotePort.onDisconnect.addListener(() =>
        portStream.off('message-too-large', handleMessageTooLarge),
      );
      portStream.on('message-too-large', handleMessageTooLarge);

      // communication with popup
      controller.isClientOpen = true;
      controller
        .setupTrustedCommunication(portStream, remotePort.sender)
        .finally(() => {
          removeCriticalErrorListeners?.();
        });
      // Snapshot the "track App Opened" decision synchronously here, before any
      // open-count is incremented below. The sidepanel path defers the actual
      // emission until refreshAppActiveTab() resolves.
      const sidepanelShouldTrackAppOpened =
        processName === ENVIRONMENT_TYPE_SIDEPANEL &&
        shouldEmitAppOpened(ENVIRONMENT_TYPE_SIDEPANEL);

      if (processName !== ENVIRONMENT_TYPE_SIDEPANEL) {
        trackAppOpened(processName);
      }

      // lazily update the remote feature flags every time the UI is opened.
      updateRemoteFeatureFlags(controller);

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        clearFailedTxBadge();
        openPopupCount += 1;
        finished(portStream, () => {
          openPopupCount -= 1;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_POPUP);
        });
      }

      if (processName === ENVIRONMENT_TYPE_SIDEPANEL) {
        clearFailedTxBadge();
        openSidePanelCount += 1;
        // Refresh appActiveTab when sidepanel opens to ensure it has the current
        // tab info. This handles the case where the user connected to a dapp while
        // the sidepanel was closed. The App Opened event is emitted only after the
        // refresh so that active_tab_domain reflects the current tab, not stale state.
        refreshAppActiveTab().then(() => {
          if (sidepanelShouldTrackAppOpened) {
            emitAppOpenedMetricEvent(ENVIRONMENT_TYPE_SIDEPANEL);
          }
        });
        finished(portStream, () => {
          openSidePanelCount = Math.max(openSidePanelCount - 1, 0);
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_SIDEPANEL);
        });
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true;

        finished(portStream, () => {
          notificationIsOpen = false;
          // Render any failure badge that was suppressed while the notification was open
          if (failedTxCount > 0) {
            setClientLandingTab(AccountOverviewTabKey.Activity);
          }
          updateBadge();
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_NOTIFICATION,
          );
        });
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        clearFailedTxBadge();
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
    } else if (senderUrl && isPhishingWarningPageUrl(senderUrl)) {
      const portStreamForPhishingPage = new ExtensionPortStream(remotePort, {
        chunkSize: 0,
      });
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
        const portStreamForCookieHandlerPage = new ExtensionPortStream(
          remotePort,
          { chunkSize: 0 },
        );
        controller.setUpCookieHandlerCommunication({
          connectionStream: portStreamForCookieHandlerPage,
        });
      }

      const portStream = new ExtensionPortStream(remotePort, { chunkSize: 0 });

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
    const senderUrl = remotePort.sender?.url;
    if (senderUrl) {
      const { hostname } = new URL(senderUrl);
      if (BLOCKED_HOSTNAMES.includes(hostname)) {
        remotePort.disconnect();
        return;
      }
    }

    const portStream = new ExtensionPortStream(remotePort, { chunkSize: 0 });

    // if the sender.id value is present it means the caller is an extension rather
    // than a site. When the caller is an extension we want to fallback to connecting
    // it with the 1193 provider
    const isDappConnecting = !remotePort.sender.id;
    if (isDappConnecting) {
      if (BLOCKED_PORTS.includes(remotePort.name)) {
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

  controller.controllerMessenger.subscribe(
    'TransactionController:transactionStatusUpdated',
    onTransactionStatusUpdated,
  );

  function setClientLandingTab(tab) {
    try {
      controller.appStateController.setDefaultHomeActiveTabName(tab ?? null);
    } catch (e) {
      console.error('Error setting landing tab:', e);
    }
  }

  function onTransactionStatusUpdated({ transactionMeta }) {
    const { status, txParams, chainId } = transactionMeta ?? {};
    if (status !== 'failed' && status !== 'dropped') {
      return;
    }

    const { from, nonce } = txParams ?? {};
    const nonceKey =
      from && nonce !== undefined && chainId
        ? `${chainId}:${from.toLowerCase()}:${nonce}`
        : undefined;
    if (nonceKey && seenFailedNonces.has(nonceKey)) {
      return;
    }

    // Skip if a persistent UI is open, transaction status is in the Activity tab
    if (hasPersistentUiOpen()) {
      return;
    }

    if (nonceKey) {
      if (seenFailedNonces.size >= maxSeenFailedNonces) {
        seenFailedNonces.clear();
      }
      seenFailedNonces.add(nonceKey);
    }

    failedTxCount += 1;

    // Defer landing page until notification closes; close handler re-applies
    if (!isOnlyNotificationOpen()) {
      setClientLandingTab(AccountOverviewTabKey.Activity);
    }

    updateBadge();
  }

  function clearFailedTxBadge() {
    seenFailedNonces.clear();
    failedTxCount = 0;
    updateBadge();
  }

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
   * Failed transactions take priority and show a red count badge.
   * Pending approvals show the standard blue count badge.
   */
  function updateBadge() {
    const pendingApprovalCount = getPendingApprovalCount();

    let label = '';
    let badgeColor = BADGE_COLOR_APPROVAL;

    // Defer showing the failure badge until the notification closes
    if (failedTxCount > 0 && !isOnlyNotificationOpen()) {
      label = getBadgeLabel(failedTxCount, BADGE_MAX_COUNT);
      badgeColor = BADGE_COLOR_FAILED;
    } else if (pendingApprovalCount > 0) {
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
      return getAttentionRequiredApprovalCount({
        approvalController: controller.approvalController,
      });
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

    controller.legacyBackgroundApiService.rejectAllPendingApprovals();
  }
}

//
// Etc...
//

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await browser.tabs.query(queryOptions);
  return tab;
}

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

  if (openSidePanelCount > 0) {
    return;
  }

  // Attempt to open the sidepanel with a roundtrip request
  if (shouldUseSidepanel(controller)) {
    const tab = await getCurrentTab();
    if (tab?.id) {
      const opened = await requestOpenSidepanel(tab.id);
      if (opened) {
        return;
      }
      // If the sidepanel failed to open, fall back to opening the popup
    }
  }

  if (
    !uiIsTriggering &&
    (isVivaldi || openPopupCount === 0) &&
    !currentlyActiveMetamaskTab &&
    openSidePanelCount === 0
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

browser.runtime.onUpdateAvailable.addListener((details) => {
  onUpdateAvailable(details, getInstallLifecycleDeps());
});

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
          emitDappViewedMetricEvent(
            currentOrigin,
            currentTabOrigin,
            frameIdMapping[tabId],
          );
        }
      }

      // If the connected dApp is a referral partner, trigger the referral flow
      const partner = getPartnerByOrigin(currentTabOrigin);
      if (partner) {
        const connectSitePermissions =
          controller.permissionController.state.subjects[currentTabOrigin];
        // when the dapp is not connected, connectSitePermissions is undefined
        const isConnectedToDapp = connectSitePermissions !== undefined;
        if (isConnectedToDapp) {
          controller.controllerMessenger
            .call(
              'LegacyBackgroundApiService:handleDefiReferral',
              partner,
              tabId,
              ReferralTriggerType.OnNavigateConnectedTab,
            )
            .catch((error) => {
              log.error(
                `Failed to handle ${partner.name} referral after navigation to connected tab: `,
                error,
              );
            });
        }
      }
    }
  });
}

setupSidePanelToolbarBehavior({
  getController: () => controller,
  waitUntilInitialized: async () => await isInitialized,
});

// Initialize appActiveTab by querying the current active tab on startup
const initializeAppActiveTab = async () => {
  await refreshAppActiveTab();
};

initializeAppActiveTab();

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
      // Clear appActiveTab when there's no URL (e.g., new blank tab)
      controller.appStateController.clearAppActiveTab();
      return {};
    }

    const { origin, protocol, host, href } = new URL(url);

    if (!isWebOrigin(origin)) {
      // Clear appActiveTab for non-web pages (chrome://, about:, extensions, etc.)
      controller.appStateController.clearAppActiveTab();
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

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Wait for controller to be initialized
  await isInitialized;
  if (!controller) {
    return {};
  }

  // Only update when URL changes or when page finishes loading
  // This prevents flickering from multiple updates during page load
  const urlChanged = changeInfo.url !== undefined;
  const statusComplete = changeInfo.status === 'complete';

  if (!urlChanged && !statusComplete) {
    return {};
  }

  try {
    // Use tab from parameter if available, otherwise fetch it.
    // The tab parameter is usually provided by Chrome, but may be undefined
    // in edge cases (e.g., when a tab is being removed), so we fall back to
    // fetching it explicitly.
    const tabInfo = tab || (await browser.tabs.get(tabId));
    const { id, title, url, favIconUrl } = tabInfo;

    // Only update if this is the currently active tab
    // This prevents updating with stale data from background tabs
    const currentAppActiveTab =
      controller.appStateController.state.appActiveTab;
    const isActiveTab = currentAppActiveTab?.id === id;

    if (!url) {
      // Only clear if this is the currently active tab
      if (isActiveTab) {
        controller.appStateController.clearAppActiveTab();
      }
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
      // Only clear if this is the currently active tab
      if (isActiveTab) {
        controller.appStateController.clearAppActiveTab();
      }
      return {};
    }

    // Also check if this tab is actually the active tab in the current window.
    // This is needed because stored appActiveTab might be stale if the user
    // switched tabs quickly, or if tabs were closed/reopened. Querying the
    // browser ensures we only update for the truly active tab.
    let isActuallyActive = false;
    try {
      const activeTabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      isActuallyActive = activeTabs.some((activeTab) => activeTab.id === id);
    } catch (error) {
      // Fallback to checking against stored active tab
      isActuallyActive = isActiveTab;
    }

    // Only update if URL changed and it's the active tab, or if status is complete and it's the active tab
    if ((urlChanged || statusComplete) && isActuallyActive) {
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
    }
  } catch (error) {
    // Ignore errors from tabs that don't exist or can't be accessed
    console.log('Error in tabs.onUpdated listener:', error.message);
  }

  return {};
});

// Window focus listener to keep appActiveTab in sync across browser windows.
// Without this, switching between Chrome windows can leave appActiveTab pointing
// at the previously focused window's tab, causing
// the connection bar [ui/components/multichain/dapp-connection-control-bar/dapp-connection-control-bar.tsx]
// to disappear or appear on the wrong window.
browser.windows.onFocusChanged.addListener(async (windowId) => {
  // WINDOW_ID_NONE means all browser windows lost focus (e.g., user switched
  // to another application). Keep appActiveTab unchanged so it stays correct
  // when the user returns to Chrome.
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    return;
  }

  await refreshAppActiveTab(windowId);
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

    // For testing: simulate initialization hang. Only when backup exists in
    // IndexedDB and we're not already in the restore flow (backup param is
    // null). Skip when backup param is non-null so vault recovery can complete.
    if (
      process.env.IN_TEST &&
      !backup &&
      getManifestFlags().testing?.simulateBackgroundInitializationHang &&
      hadVaultAtStartupRecently(inTestState.hasVaultAtStartup)
    ) {
      log.info(
        'Simulating initialization hang (simulateBackgroundInitializationHang flag is set, backup exists)',
      );
      await new Promise(() => {
        // Intentionally never resolves to simulate a hang
      });
    }

    log.info('MetaMask initialization complete.');
    resolveInitialization();
  } catch (error) {
    log.error(error);
    rejectInitialization(error);
  }
}
/**
 * Service worker entry for background startup: normal init, or critical-error
 * restore (when a session and vault backup exist).
 */
async function initOrRestoreBackground() {
  if (process.env.SKIP_BACKGROUND_INITIALIZATION) {
    return;
  }

  const restoreSession = await readCriticalErrorRestoreSession(browser);

  // Fetch the backup once, shared by the restore path below and by
  // the simulateBackground*Hang test flags (which need to know whether a
  // backup already existed at startup, before onboarding can create one).
  const testingFlags = process.env.IN_TEST
    ? getManifestFlags().testing
    : undefined;
  let backup = null;
  if (
    restoreSession ||
    testingFlags?.simulateBackgroundStateSyncHang ||
    testingFlags?.simulateBackgroundInitializationHang
  ) {
    backup = await persistenceManager.getBackup().catch(() => null);
  }

  const backupHasVault = hasVault(backup);

  if (
    testingFlags?.simulateBackgroundStateSyncHang ||
    testingFlags?.simulateBackgroundInitializationHang
  ) {
    if (inTestState) {
      inTestState.hasVaultAtStartup = backupHasVault ? Date.now() : null;
    }
  }

  if (restoreSession) {
    await clearCriticalErrorRestoreSession(browser);
    if (backupHasVault) {
      if (inTestState) {
        inTestState.restoreInProgress = true;
      }
      const handoffPayload = {
        tabId: restoreSession.tabId,
        tabUrl: restoreSession.tabUrl,
      };
      initBackground(backup);
      try {
        await isInitialized;
      } catch (error) {
        log.error('critical-error-restore: initialization failed', error);
        return;
      }

      controller.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.restore,
      );

      await handoffRestoringTabToExtension(platform, handoffPayload);
      return;
    }
  }

  initBackground(null);
}

initOrRestoreBackground().catch((error) => {
  log.error('initOrRestoreBackground failed', error);
});

if (process.env.IN_TEST) {
  // listen for test messages from the background
  // maintenance note: if you can't find any tests containing 'STOP_PERSISTENCE'
  // you can remove this, and probably the evacuate function in app\scripts\lib\safe-reload.ts too.
  browser.runtime.onMessage.addListener(async (message, _sender) => {
    if (message.type === 'STOP_PERSISTENCE') {
      await evacuate();
      return { status: 'PERSISTENCE_STOPPED' };
    }
    return Promise.resolve();
  });
  // Load conditionally so this test-only package is excluded from production builds and policies.
  global.stateHooks.hasConsoleAccess = () =>
    // eslint-disable-next-line n/global-require
    require('@metamask/dummy-package').hasConsoleAccess();
}
