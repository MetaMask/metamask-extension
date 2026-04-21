/**
 * @file The entry point for the web extension singleton process.
 */

/* eslint-disable import-x/order -- side-effect imports must run before other modules */

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
import { persistenceManager } from './lib/setup-initial-state-hooks';

// Import this very early, so globalThis.INFURA_PROJECT_ID_FROM_MANIFEST_FLAGS is always defined
import '../../shared/constants/infura-project-id';

import { lightTheme } from '@metamask/design-tokens';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- readable-stream ships no .d.ts; `finished` exists at runtime
import { finished } from 'readable-stream';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import { isObject, hasProperty } from '@metamask/utils';
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
  POPUP_FILE,
  POPUP_INIT_FILE,
  SIDEPANEL_FILE,
} from '../../shared/constants/app';
import { EXTENSION_MESSAGES } from '../../shared/constants/messages';
import { BACKGROUND_LIVENESS_METHOD } from '../../shared/constants/ui-initialization';
import {
  REJECT_NOTIFICATION_CLOSE,
  REJECT_NOTIFICATION_CLOSE_SIG,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../shared/constants/metametrics';
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
import { getDeferredDeepLinkFromCookie } from '../../shared/lib/deep-links/utils';
import { backedUpStateKeys } from '../../shared/lib/stores/persistence-manager';
import {
  CorruptionHandler,
  hasVault,
} from './lib/state-corruption/state-corruption-recovery';
import { useSplitStateStorage } from './lib/use-split-state-storage';
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
import { SubjectType } from '@metamask/permission-controller';
import getObjStructure from './lib/getObjStructure';
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
import { onUpdate } from './on-update';

/* eslint-enable import-x/first */

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
import { ReferralTriggerType } from './lib/createDefiReferralMiddleware';
import { getIframeProperties } from './lib/getIframeProperties';

import type { Duplex } from 'stream';
import type { Backup } from '../../shared/lib/stores/persistence-manager';
import type {
  MetaData,
  MetaMaskStorageStructure,
} from '../../shared/lib/stores/base-store';
import type { ErrorLike } from '../../shared/constants/errors';
import type { Runtime } from 'webextension-polyfill';

// MV3 configures the ExtensionLazyListener in service-worker.ts and sets it on globalThis.stateHooks,
// but in MV2 we don't need to do that, so we create it here (and we don't add any lazy listeners,
// as it doesn't need them).
const lazyListener = (globalThis.stateHooks.lazyListener ??
  new ExtensionLazyListener(browser)) as ExtensionLazyListener<typeof browser>;

// webextension-polyfill does not include sidePanel types (Chrome-only API).
type BrowserWithSidePanel = typeof browser & {
  sidePanel?: {
    setPanelBehavior?: (options: {
      openPanelOnActionClick: boolean;
    }) => Promise<void>;
    setOptions?: (options: { path: string }) => void;
  };
};

type BackgroundOverrides = {
  getPortStream?: (port: Runtime.Port) => ExtensionPortStream;
  registerConnectListeners?: (
    connectWindowPostMessage: (remotePort: Runtime.Port) => void,
    connectEip1193: (
      connectionStream: Duplex | NodeJS.ReadWriteStream,
      sender: Runtime.MessageSender | undefined,
    ) => void,
  ) => void;
  keyrings?: {
    trezorBridge: unknown;
    ledgerBridge: unknown;
    qrBridge: unknown;
  };
};

// eslint-disable-next-line @metamask/design-tokens/color-no-hex
const BADGE_COLOR_APPROVAL = '#0376C9';
const BADGE_COLOR_FAILED = lightTheme.colors.error.default;
const BADGE_MAX_COUNT = 9;
const maxSeenFailedNonces = 99;

const inTest = process.env.IN_TEST;

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
const POPUP_LAUNCH_FILE = isFirefox ? POPUP_FILE : POPUP_INIT_FILE;

function parsePortInfo(port: Runtime.Port): {
  processName: string;
  senderUrl: URL | null;
  isMetaMaskUIPort: boolean;
} {
  const processName = port.name;
  const senderUrl = port.sender?.url ? new URL(port.sender.url) : null;

  let isMetaMaskUIPort;
  if (isFirefox) {
    isMetaMaskUIPort = Boolean(
      (metamaskInternalProcessHash as Record<string, boolean>)[processName],
    );
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
const seenFailedNonces = new Set<string>();
const openMetamaskTabsIDs: Record<number, boolean> = {};
const requestAccountTabIds: Record<string, number> = {};
let controller: MetamaskController;
const senderOriginMapping: Record<number, string> = {};
const tabOriginMapping: Record<number, string> = {};
const frameIdMapping: Record<number, number> = {};

if (inTest || process.env.METAMASK_DEBUG) {
  global.stateHooks.metamaskGetState = persistenceManager.get.bind(
    persistenceManager,
    { validateVault: false },
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const phishingPageUrl = new URL(process.env.PHISHING_WARNING_PAGE_URL!);

// normalized (adds a trailing slash to the end of the domain if it's missing)
// the URL once and reuse it:
const phishingPageHref = phishingPageUrl.toString();

const ONE_SECOND_IN_MILLISECONDS = 1_000;
// Timeout for initializing phishing warning page.
const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

// lazyListener.once union overload is not resolvable statically; cast the result.
(
  lazyListener.once as (
    ...args: unknown[]
  ) => Promise<[Runtime.OnInstalledDetailsType]>
)('runtime', 'onInstalled').then((details) => {
  handleOnInstalled(details);
});

/**
 * This deferred Promise is used to track whether initialization has finished.
 *
 * It is very important to ensure that `resolveInitialization` is *always*
 * called once initialization has completed, and that `rejectInitialization` is
 * called if initialization fails in an unrecoverable way.
 */
let isInitialized: Promise<void>;
let resolveInitialization: (value?: void | PromiseLike<void>) => void;
let rejectInitialization: (reason?: unknown) => void;

/**
 * Creates a deferred Promise and sets the global variables to track the
 * state of application initialization (or re-initialization).
 */
function setGlobalInitializers() {
  const deferred = withResolvers<void>();
  isInitialized = deferred.promise;
  resolveInitialization = deferred.resolve;
  rejectInitialization = deferred.reject;
}
setGlobalInitializers();

/**
 * Prefer opening the side panel on toolbar click as soon as the service worker starts.
 * Without this, the first click after a cold start can use manifest `default_popup` until
 * {@link setupSidePanelToolbarBehavior} runs after {@link isInitialized}.
 */
function applyEarlySidePanelToolbarBehavior() {
  if (!(browser as BrowserWithSidePanel)?.sidePanel?.setPanelBehavior) {
    return;
  }
  (browser as BrowserWithSidePanel).sidePanel
    ?.setPanelBehavior?.({
      openPanelOnActionClick: true,
    })
    ?.catch(() => {
      // Non-fatal: `applyToolbarSidePanelBehavior` applies persisted preference once ready.
    });
}
applyEarlySidePanelToolbarBehavior();

/**
 * Sends a message to the dapp(s) content script to signal it can connect to MetaMask background as
 * the backend is not active. It is required to re-connect dapps after service worker re-activates.
 * For non-dapp pages, the message will be sent and ignored.
 */
const sendReadyMessageToTabs = async () => {
  const tabs =
    (await browser.tabs
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
         * "If the extension has access to inject scripts into Tab, then we can return the url
         * of Tab (because the extension could just inject a script to message the location.href)."
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
      })) ?? [];

  /** @todo we should only sendMessage to dapp tabs, not all tabs. */
  for (const tab of tabs) {
    if (tab.id === undefined) {
      continue;
    }
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
 * @param theController
 */
function maybeDetectPhishing(theController: MetamaskController) {
  /**
   * Redirects a tab to the phishing warning page.
   *
   * @param tabId - The ID of the tab to redirect
   * @param url - The URL to redirect to (phishing warning page)
   * @returns Returns true if the redirect was successful, false otherwise.
   * Returns false for Google pre-fetch requests or if the redirect fails.
   */
  async function redirectTab(tabId: number, url: string): Promise<boolean> {
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
        blockedUrl = details.initiator ?? href;
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
                requestDomain: blockedRequestResponse.result ? hostname : null,
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
 */
let connectWindowPostMessage: (remotePort: Runtime.Port) => void;

/**
 * Connects an externally_connectable Port to the MetaMask controller.
 * This method identifies dapp clients and connects them differently from extension clients.
 */
let connectExternallyConnectable: (remotePort: Runtime.Port) => void;

/**
 * Connects a Duplex stream to the MetaMask controller EIP-1193 API (via a multiplexed duplex stream).
 */
let connectEip1193: (
  connectionStream: Duplex | NodeJS.ReadWriteStream,
  sender: Runtime.MessageSender | undefined,
) => void;

/**
 * Connects a Duplex stream to the MetaMask controller Caip Multichain API.
 */
let connectCaipMultichain: (
  connectionStream: Duplex | NodeJS.ReadWriteStream,
  sender: Runtime.MessageSender | undefined,
) => void;

const corruptionHandler = new CorruptionHandler();
/**
 * Handles the onConnect event.
 *
 * @param port - The port provided by a new context.
 */
const handleOnConnect = async (port: Runtime.Port) => {
  if (inTest) {
    const simulatedDelay =
      getManifestFlags().testing?.simulateDelayedBackgroundResponse;
    if (simulatedDelay === true) {
      return;
    } else if (typeof simulatedDelay === 'number') {
      await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
    } else if (simulatedDelay !== undefined) {
      log.error(
        `Unrecognized value for 'simulateDelayedBackgroundResponse': '${String(simulatedDelay)}'`,
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

  // Queue up connection attempts here, waiting until after initialization
  try {
    await isInitialized;

    // This is set in `setupController`, which is called as part of initialization
    connectWindowPostMessage(port);
  } catch (error) {
    sentry?.captureException(error);

    // Only handle errors for MetaMask UI connections (popup, notification, fullscreen),
    // not for contentscripts injected into regular web pages.
    // Contentscripts can't display error screens and would create hanging promises.
    if (parsePortInfo(port).isMetaMaskUIPort) {
      // If we have a STATE_CORRUPTION_ERROR tell the user about it and offer to
      // restore from a backup, if we have one.
      if (error instanceof Error && isStateCorruptionError(error)) {
        await corruptionHandler.handleStateCorruptionError({
          port: port as unknown as chrome.runtime.Port,
          error: error as ErrorLike,
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
              message: String(error.message ?? 'Unknown error'),
              name: String(error.name ?? 'UnknownError'),
              stack: typeof error.stack === 'string' ? error.stack : undefined,
              // Preserve sentryTags for searchable/filterable fields in Sentry UI
              ...(isObject(error.sentryTags)
                ? { sentryTags: error.sentryTags }
                : {}),
            }
          : {
              message: String(error),
              name: 'UnknownError',
              stack: '',
            };
        tryPostMessage(
          port as unknown as chrome.runtime.Port,
          DISPLAY_GENERAL_STARTUP_ERROR,
          {
            error: errorLike,
            currentLocale:
              controller?.preferencesController?.state?.currentLocale,
          },
        );
      }
    }
  }
};
const installOnConnectListener = () => {
  lazyListener.addListener('runtime', 'onConnect', handleOnConnect);
};
const testingFlags = getManifestFlags().testing;
if (inTest && testingFlags?.simulatedSlowBackgroundLoadingTimeout) {
  setTimeout(
    installOnConnectListener,
    testingFlags.simulatedSlowBackgroundLoadingTimeout,
  );
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
 * @param backup
 * @returns Setup complete.
 */
async function initialize(backup: Backup | null) {
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
    addOffscreenConnectivityListener((isOnline: boolean) => {
      const api = controller.messengerClientApi as Record<string, unknown>;
      if (
        connectivityReady &&
        typeof api.setConnectivityStatus === 'function'
      ) {
        const status = isOnline ? 'online' : 'offline';
        (api.setConnectivityStatus as (s: string) => void)(status);
      } else {
        // Queue until controller is ready
        pendingConnectivityStatus = isOnline;
      }
    });
  }

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
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
      require('../../test/e2e/background-socket/socket-background-to-mocha');
    getSocketBackgroundToMocha();
  }

  if (isManifestV3) {
    // Save the timestamp immediately and then every `SAVE_TIMESTAMP_INTERVAL`
    // miliseconds. This keeps the service worker alive.
    if (
      (initState.PreferencesController as Record<string, unknown> | undefined)
        ?.enableMV3TimestampSave !== false
    ) {
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
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
          trezorBridge: require('../../test/stub/keyring-bridge')
            .FakeTrezorBridge,
          // Use `require` to make it easier to exclude this test code from the Browserify build.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
          ledgerBridge: require('../../test/stub/keyring-bridge')
            .FakeLedgerBridge,
          // Use `require` to make it easier to exclude this test code from the Browserify build.
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
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
    isFirstMetaMaskControllerSetup ?? true,
    initData.meta,
    offscreenPromise,
    preinstalledSnaps,
    cronjobControllerStorageManager,
  );

  controller.metaMetricsController.updateTraits({
    [MetaMetricsUserTrait.StorageKind]: persistenceManager.storageKind,
  });

  // `setupController` sets up the `controller` object, so we can use it now:
  maybeDetectPhishing(controller);

  // Set up connectivity detection
  const callSetConnectivityStatus = (status: 'online' | 'offline') => {
    const api = controller.messengerClientApi as Record<string, unknown>;
    if (typeof api.setConnectivityStatus === 'function') {
      (api.setConnectivityStatus as (s: 'online' | 'offline') => void)(status);
    }
  };

  if (isManifestV3) {
    // MV3: Listener was set up earlier, now apply any pending status and mark ready
    connectivityReady = true;
    if (pendingConnectivityStatus !== null) {
      const status = pendingConnectivityStatus ? 'online' : 'offline';
      callSetConnectivityStatus(status);
    }
  } else {
    // MV2: Background page has access to window events
    const updateConnectivity = (isOnline: boolean) => {
      const status = isOnline ? 'online' : 'offline';
      callSetConnectivityStatus(status);
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
    const response = await fetchWithTimeout(url.href);

    // If the Snap is compressed, decompress it
    if (url.pathname.endsWith('.json.gz')) {
      const ds = new DecompressionStream('gzip');
      if (!response.body) {
        throw new Error(`Response body is null for ${url.href}`);
      }
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
    let deferredResolve: () => void;
    let deferredReject: (reason?: unknown) => void;
    const loadComplete = new Promise<void>((resolve, reject) => {
      deferredResolve = resolve;
      deferredReject = reject;
    });

    // The load event is emitted once loading has completed, even if the loading failed.
    // If loading failed we can't do anything about it, so we don't need to check.
    iframe.addEventListener('load', () => deferredResolve());

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

export async function loadStateFromPersistence(
  backup: Backup | null,
): Promise<{ data: Record<string, unknown>; meta: MetaData }> {
  if (process.env.WITH_STATE) {
    const withState = JSON.parse(process.env.WITH_STATE);

    // Use `require` to make it easier to exclude this test code from the Browserify build.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
    const { generateWalletState } = require('./fixtures/generate-wallet-state');
    const fixtureBuilder = await generateWalletState(withState, false);

    const stateOverrides = fixtureBuilder.fixture.data;
    firstTimeState = { ...firstTimeState, ...stateOverrides };
  }

  // read from disk
  // first from preferred, async API:
  let preMigrationVersionedData:
    | {
        data: Record<string, unknown>;
        meta: Record<string, unknown>;
      }
    | MetaMaskStorageStructure
    | null
    | undefined;
  if (backup) {
    preMigrationVersionedData = {
      data: {} as Record<string, unknown>,
      meta: {} as Record<string, unknown>,
    };
    for (const key of backedUpStateKeys) {
      if (hasProperty(backup, key)) {
        preMigrationVersionedData.data[key] = backup[key];
      }
    }
    // use the meta property from the backup if it exists, that way the
    // migrations will behave correctly.
    if (hasProperty(backup, 'meta') && isObject(backup.meta)) {
      preMigrationVersionedData.meta = backup.meta;
      // old versions of meta used "data" as the storage kind, without
      // explicitly setting the "storageKind" to data. If it is missing, we just
      // always default to "data" ("data" was the default before "split"
      // existed).
      // We need to set it properly here so that the persistence manager uses
      // the correct storage kind when restoring from the `backup`.
      if (
        backup.meta.storageKind === 'split' ||
        backup.meta.storageKind === 'data'
      ) {
        persistenceManager.storageKind = backup.meta.storageKind;
      } else {
        persistenceManager.storageKind = 'data';
      }
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
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require
        require('../../test/e2e/fixtures/default-fixture.json').meta.version
      : null,
  });

  // report migration errors to sentry
  migrator.on('error', (err) => {
    console.warn(err);
    // get vault structure without secrets
    const vaultStructure = getObjStructure(preMigrationVersionedData ?? {});
    sentry?.captureException(err, {
      // "extra" key is required by Sentry
      extra: { vaultStructure },
    });
  });

  let writeAllKeysToState = false;
  if (!preMigrationVersionedData?.data && !preMigrationVersionedData?.meta) {
    // brand new state; write all keys!
    writeAllKeysToState = true;
    preMigrationVersionedData = migrator.generateInitialState(
      firstTimeState,
    ) as {
      data: Record<string, unknown>;
      meta: Record<string, unknown>;
    };
  }

  // migrate data
  const { state: rawVersionedData, changedKeys } = await migrator.migrateData(
    preMigrationVersionedData as { data: object; meta: { version: number } },
  );
  // Widen the meta type to include optional MetaData fields used downstream
  const versionedData = rawVersionedData as {
    data: typeof rawVersionedData.data;
    meta: MetaData;
  };

  /**
   * Creates an Error with sentryTags for migration failures.
   * Tags help identify if user should have had a backup (v12.20.0+, migration 157+),
   * and include installation info for diagnostics.
   * These are captured via the critical error page's "Send error report" checkbox
   * flow (see ui/helpers/utils/display-critical-error.ts).
   *
   * @param message - The error message
   * @returns Error object with sentryTags property
   */
  const createMigrationError = async (message: string) => {
    const preMigrationVersion = preMigrationVersionedData?.meta?.version;
    const backupShouldExist =
      typeof preMigrationVersion === 'number' && preMigrationVersion >= 157;

    // Try to get firstTimeInfo for Sentry tags (installation version and date)
    // Check in-memory sources first (fast, synchronous checks)
    // Check both new location (AppMetadataController) and old location (top-level)
    // for compatibility with pre-migration-190 state
    type StateRecord = Record<string, Record<string, unknown> | unknown>;
    const backupRec = backup as StateRecord | null;
    const vdData = versionedData?.data as StateRecord | undefined;
    const pmvdData = preMigrationVersionedData?.data as StateRecord | undefined;
    let firstTimeInfo =
      (backupRec?.AppMetadataController as StateRecord | undefined)
        ?.firstTimeInfo ??
      (vdData?.AppMetadataController as StateRecord | undefined)
        ?.firstTimeInfo ??
      vdData?.firstTimeInfo ??
      (pmvdData?.AppMetadataController as StateRecord | undefined)
        ?.firstTimeInfo ??
      pmvdData?.firstTimeInfo;

    // Fallback to IndexedDB backup if in-memory sources don't have it
    // (handles corruption scenarios where storage.local is damaged)
    if (!firstTimeInfo) {
      try {
        const indexedDbBackup =
          (await persistenceManager.getBackup()) as StateRecord | null;
        firstTimeInfo = (
          indexedDbBackup?.AppMetadataController as StateRecord | undefined
        )?.firstTimeInfo;
      } catch {
        // Ignore backup fetch errors - we still want to report the migration error
      }
    }

    const error = new Error(message) as Error & {
      sentryTags?: Record<string, string>;
    };
    const fti = firstTimeInfo as Record<string, unknown> | undefined;

    // Add sentryTags for searchable/filterable fields in Sentry UI
    // These are extracted by sendErrorToSentry in display-critical-error.ts
    error.sentryTags = {
      'corruption.preMigrationVersion': String(
        preMigrationVersion ?? 'unknown',
      ),
      'corruption.backupShouldExist': String(backupShouldExist),
      'corruption.installVersion': String(fti?.version ?? 'unknown'),
      'corruption.installDate': String(fti?.date ?? 'unknown'),
    };

    return error;
  };

  if (!versionedData) {
    throw await createMigrationError('MetaMask - migrator returned undefined');
  } else if (!isObject(versionedData.meta)) {
    throw await createMigrationError(
      `MetaMask - migrator metadata has invalid type '${typeof versionedData.meta}'`,
    );
  } else if (typeof versionedData.meta.version !== 'number') {
    throw await createMigrationError(
      `MetaMask - migrator metadata version has invalid type '${typeof versionedData.meta.version}'`,
    );
  } else if (
    !['data', 'split', undefined].includes(versionedData.meta.storageKind)
  ) {
    throw await createMigrationError(
      `MetaMask - migrator metadata storageKind has invalid value '${versionedData.meta.storageKind}'`,
    );
  } else if (!isObject(versionedData.data)) {
    throw await createMigrationError(
      `MetaMask - migrator data has invalid type '${typeof versionedData.data}'`,
    );
  }
  // this initializes the meta/version data as a class variable to be used for future writes
  persistenceManager.setMetadata(versionedData.meta);

  log.debug(
    "[Split State]: Loaded data from persistence with storageKind '%s'",
    persistenceManager.storageKind,
  );
  if (persistenceManager.storageKind === 'data') {
    const alreadyTried =
      versionedData.meta.platformSplitStateGradualRolloutAttempted === true;
    const shouldUseSplitStateStorage =
      !alreadyTried && (await useSplitStateStorage(versionedData.data));
    log.debug(
      '[Split State]: shouldUseSplitStateStorage: %s (alreadyTried: %s)',
      shouldUseSplitStateStorage,
      alreadyTried,
    );
    if (shouldUseSplitStateStorage) {
      // a sigil to mark that we *tried* to migrate to split state storage
      versionedData.meta.platformSplitStateGradualRolloutAttempted = true;
      persistenceManager.setMetadata(versionedData.meta);
    }

    log.debug(
      "[Split State]: Writing data to persistence with storageKind 'data'",
    );
    // write to disk
    await persistenceManager.set(versionedData.data);

    if (shouldUseSplitStateStorage) {
      await persistenceManager.migrateToSplitState(versionedData.data);
      const updatedMeta = persistenceManager.getMetaData();
      if (updatedMeta !== undefined) {
        versionedData.meta = updatedMeta;
        delete versionedData.meta.platformSplitStateGradualRolloutAttempted;
        // persist the new metadata one more time
        persistenceManager.setMetadata(versionedData.meta);
      }
      await persistenceManager.persist();
    }
  } else if (persistenceManager.storageKind === 'split') {
    if (writeAllKeysToState) {
      for (const [key, value] of Object.entries(versionedData.data)) {
        persistenceManager.update(key, value);
      }
    } else {
      // write changes only
      for (const key of changedKeys) {
        persistenceManager.update(key, versionedData.data[key]);
      }
    }
    // write to disk
    await persistenceManager.persist();
  } else {
    throw new Error(
      `MetaMask - persistenceManager has invalid storageKind '${String(persistenceManager.storageKind)}'`,
    );
  }
  log.debug('[Split State]: Load complete.');

  // return just the data
  return versionedData as { data: Record<string, unknown>; meta: MetaData };
}

/**
 * Emit event of DappViewed,
 * which should only be tracked only after a user opts into metrics and connected to the dapp
 *
 * @param origin - URL of visited dapp
 * @param [mainFrameOrigin] - The top-level frame origin (if sender is an iframe, this differs from origin)
 * @param [frameId] - The frame ID from chrome.runtime.MessageSender (0 = top-level, >0 = iframe)
 */
function emitDappViewedMetricEvent(
  origin: string,
  mainFrameOrigin: string,
  frameId: number,
) {
  const { metaMetricsId } = controller.metaMetricsController.state;
  if (!shouldEmitDappViewedEvent(metaMetricsId)) {
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

  controller.metaMetricsController.trackEvent(
    {
      event: MetaMetricsEventName.DappViewed,
      category: MetaMetricsEventCategory.InpageProvider,
      referrer: {
        url: origin,
      },
      /* eslint-disable @typescript-eslint/naming-convention -- analytics schema */
      properties: {
        is_first_visit: false,
        number_of_accounts: numberOfTotalAccounts,
        number_of_accounts_connected: numberOfConnectedAccounts,
        ...iframeProps,
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    },
    {
      excludeMetaMetricsId: true,
    },
  );
}

/**
 * Track dapp connection when loaded and permissioned
 *
 * @param remotePort - The port provided by a new context.
 */
function trackDappView(remotePort: Runtime.Port) {
  if (
    !remotePort.sender?.tab ||
    !remotePort.sender?.url ||
    !remotePort.sender?.tab?.url
  ) {
    return;
  }
  const tabId = remotePort.sender.tab.id;
  const { frameId } = remotePort.sender;
  if (tabId === undefined || frameId === undefined) {
    return;
  }
  const url = new URL(remotePort.sender.url);
  const { origin } = url;
  const tabUrl = new URL(remotePort.sender.tab.url);
  const { origin: tabOrigin } = tabUrl;

  // store the origin to corresponding tab so it can provide info for onActivated listener
  if (!Object.keys(senderOriginMapping).includes(String(tabId))) {
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
 * @param environmentType - The environment type where the app is opening
 */
function emitAppOpenedMetricEvent(environmentType: string) {
  const { metaMetricsId, participateInMetaMetrics } =
    controller.metaMetricsController.state;

  // Skip if user hasn't opted into metrics
  if (metaMetricsId === null && !participateInMetaMetrics) {
    return;
  }

  controller.metaMetricsController.trackEvent({
    event: MetaMetricsEventName.AppOpened,
    category: MetaMetricsEventCategory.App,
    environmentType,
  });
}

/**
 * This function checks if the app is being opened
 * and emits an event only if no other UI instances are currently open.
 *
 * @param environment - The environment type where the app is opening
 */
function trackAppOpened(environment: string) {
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
  if (!isAlreadyOpen && environmentTypeList.includes(environment)) {
    emitAppOpenedMetricEvent(environment);
  }
}

/**
 * Helper function to refresh appActiveTab by querying the current active tab.
 * This is used when the sidepanel opens to ensure it has the current tab info,
 * and when the focused window changes to keep appActiveTab in sync.
 *
 * @param [windowId] - If provided, queries the active tab in this
 * specific window. Otherwise queries the active tab in the current window.
 */
const refreshAppActiveTab = async (windowId?: number) => {
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

    if (id === undefined || !url) {
      // Clear appActiveTab when there's no URL (e.g., new blank tab) or no tab id
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
      title: title ?? '',
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
      subjectType: SubjectType.Website,
    });
  } catch (error) {
    console.log(
      'Error refreshing appActiveTab:',
      error instanceof Error ? error.message : String(error),
    );
  }
};

/**
 * Initializes the MetaMask Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param initState
 * @param initLangCode
 * @param overrides
 * @param isFirstMetaMaskControllerSetup
 * @param stateMetadata
 * @param stateMetadata.version
 * @param offscreenPromise
 * @param preinstalledSnaps
 * @param cronjobControllerStorageManager
 */
export function setupController(
  initState: Record<string, unknown>,
  initLangCode: string,
  overrides: BackgroundOverrides,
  isFirstMetaMaskControllerSetup: boolean,
  stateMetadata: MetaData,
  offscreenPromise: Promise<void> | null,
  preinstalledSnaps: unknown[],
  cronjobControllerStorageManager: CronjobControllerStorageManager,
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

  // Wire up the callback to notify the UI when set operations fail
  persistenceManager.setOnSetFailed((errorType) => {
    controller.appStateController.setStorageWriteErrorType(errorType);
  });

  /**
   * @type {Array<string>} List of controller store keys that have changed since initialization.
   */
  const changedControllerKeys = [];
  const currentState = controller.registry.getPersistedState();
  for (const key of Object.keys(currentState)) {
    const initialControllerState = (initState[key] || {}) as Record<
      string,
      unknown
    >;
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

    controller.registry.scheduleOnStateChangeWithKeys(
      'persist',
      async (changedKeys) => {
        // Project and update each changed controller's persisted state.
        // State is read at flush time (latest) rather than from the event
        // payload — safe because state progresses monotonically.
        for (const controllerKey of changedKeys) {
          const ctrl = controller.registry.persistConfig[controllerKey];
          const fullState = controller.controllerMessenger.call(
            `${controllerKey}:getState`,
          );
          const newState = deriveStateFromMetadata(
            fullState,
            ctrl.metadata,
            'persist',
          );
          persistenceManager.update(controllerKey, newState);
        }

        // if any changed key is one of the `backedUpStateKeys` we must
        // re-persist all of the other `backedUpStateKeys`, as they must
        // always be stored in the backup DB together.
        const needsBackup = [...changedKeys].some((k) =>
          (backedUpStateKeys as readonly string[]).includes(k),
        );
        if (needsBackup) {
          for (const key of backedUpStateKeys) {
            if (changedKeys.has(key)) {
              continue; // already updated above
            }
            const backupCtrl = controller.registry.persistConfig[key];
            if (!backupCtrl?.metadata) {
              throw new Error(
                `Cannot backup ${key}: controller metadata is required but not found. ` +
                  `All controllers in backedUpStateKeys must extend BaseController and define metadata.`,
              );
            }
            const backupFullState = controller.controllerMessenger.call(
              `${key}:getState`,
            );
            const state = deriveStateFromMetadata(
              backupFullState,
              backupCtrl.metadata,
              'persist',
            );
            persistenceManager.update(key, state);
          }
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
    controller.registry.scheduleOnStateChange('persist', () =>
      safePersist(controller.registry.getPersistedState()),
    );
  }

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

  const onCloseEnvironmentInstances = (
    isClientOpen: boolean,
    environmentType: string,
  ) => {
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

  connectWindowPostMessage = (remotePort) => {
    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    const { processName, senderUrl, isMetaMaskUIPort } =
      parsePortInfo(remotePort);

    if (isMetaMaskUIPort) {
      /**
       * @type {ExtensionPortStream}
       */
      const portStream =
        overrides?.getPortStream?.(remotePort) ||
        new ExtensionPortStream(remotePort);

      /**
       * send event to sentry with details about the event
       *
       * @param details
       * @param details.chunkSize
       */
      const handleMessageTooLarge = function ({
        chunkSize,
      }: {
        chunkSize: number;
      }) {
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
      // webextension-polyfill's Runtime.MessageSender is structurally compatible
      // with chrome.runtime.MessageSender; the MC JS infers a wider sender type
      // (including snapId for Snap connections) that neither polyfill type satisfies.
      controller.setupTrustedCommunication(
        portStream,
        remotePort.sender as unknown as Parameters<
          typeof controller.setupTrustedCommunication
        >[1],
      );
      trackAppOpened(processName);

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
        // Refresh appActiveTab when sidepanel opens to ensure it has the current tab info
        // This handles the case where user connected to dapp while sidepanel was closed
        refreshAppActiveTab();
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
            setClientOpenOptions('activity');
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
        const tabId = remotePort.sender?.tab?.id;
        if (tabId === undefined) {
          return;
        }
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

        if (tabId !== undefined) {
          remotePort.onMessage.addListener(
            (msg: { data?: { method?: string } }) => {
              if (
                msg.data &&
                msg.data.method === MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS
              ) {
                requestAccountTabIds[origin] = tabId;
              }
            },
          );
        }
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
    const isDappConnecting = !remotePort.sender?.id;
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
      subjectType: undefined,
    });
  };

  connectCaipMultichain = (connectionStream, sender) => {
    controller.setupUntrustedCommunicationCaip({
      connectionStream,
      sender,
      subjectType: undefined,
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

  controller.controllerMessenger.subscribe(
    'TransactionController:transactionStatusUpdated',
    onTransactionStatusUpdated,
  );

  const hasPersistentUiOpen = () => {
    return (
      openPopupCount > 0 ||
      openSidePanelCount > 0 ||
      Object.keys(openMetamaskTabsIDs).length > 0
    );
  };

  const isOnlyNotificationOpen = () => {
    return notificationIsOpen && !hasPersistentUiOpen();
  };

  function setClientOpenOptions(tab?: string) {
    const popup = tab ? `${POPUP_LAUNCH_FILE}?tab=${tab}` : POPUP_LAUNCH_FILE;
    const sidepanelPath = tab ? `${SIDEPANEL_FILE}?tab=${tab}` : SIDEPANEL_FILE;

    try {
      if (isManifestV3) {
        browser.action.setPopup({ popup });
        (browser as BrowserWithSidePanel).sidePanel?.setOptions?.({
          path: sidepanelPath,
        });
      } else {
        browser.browserAction.setPopup({ popup });
      }
    } catch (e) {
      console.error('Error setting extension action URLs:', e);
    }
  }

  function onTransactionStatusUpdated({
    transactionMeta,
  }: {
    transactionMeta?: { status?: string; txParams?: { from?: string; nonce?: string }; chainId?: string };
  }) {
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
      setClientOpenOptions('activity');
    }

    updateBadge();
  }

  function clearFailedTxBadge() {
    seenFailedNonces.clear();
    failedTxCount = 0;
    setClientOpenOptions();
    updateBadge();
  }

  /**
   * Formats a count for display as a badge label.
   *
   * @param count - The count to be formatted.
   * @param maxCount - The maximum count to display before using the '+' suffix.
   * @returns The formatted badge label.
   */
  function getBadgeLabel(count: number, maxCount: number) {
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
    tabs.find((tab) => tab.id !== undefined && openMetamaskTabsIDs[tab.id]),
  );
  // Vivaldi is not closing port connection on popup close, so openPopupCount does not work correctly
  // To be reviewed in the future if this behaviour is fixed - also the way we determine isVivaldi variable might change at some point
  const vivTab = tabs[0] as (typeof tabs)[0] & { extData?: string };
  const isVivaldi =
    tabs.length > 0 &&
    vivTab.extData &&
    vivTab.extData.indexOf('vivaldi_tab') > -1;
  if (
    !uiIsTriggering &&
    (isVivaldi || openPopupCount === 0) &&
    !currentlyActiveMetamaskTab &&
    openSidePanelCount === 0 &&
    true
  ) {
    uiIsTriggering = true;
    try {
      const currentPopupId = controller.appStateController.getCurrentPopupId();
      await notificationManager.showPopup(
        (newPopupId: number) =>
          controller.appStateController.setCurrentPopupId(newPopupId),
        currentPopupId ?? 0,
      );
    } finally {
      uiIsTriggering = false;
    }
  }
}

// It adds the "App Installed" event into a queue of events, which will be tracked only after a user opts into metrics.
const addAppInstalledEvent = async () => {
  if (controller) {
    controller.metaMetricsController.updateTraits({
      [MetaMetricsUserTrait.InstallDateExt]: new Date()
        .toISOString()
        .split('T')[0], // yyyy-mm-dd
    });

    const deferredDeepLink = await getDeferredDeepLinkFromCookie();
    const eventProperties: Record<string, string> = {};

    if (deferredDeepLink) {
      controller.appStateController.setDeferredDeepLink(deferredDeepLink);
      eventProperties.install_source = 'deeplink';
      eventProperties.deeplink_path = deferredDeepLink.referringLink;
    }

    controller.metaMetricsController.addEventBeforeMetricsOptIn({
      category: MetaMetricsEventCategory.App,
      event: MetaMetricsEventName.AppInstalled,
      properties: eventProperties,
    });
    return;
  }
  setTimeout(async () => {
    // If the controller is not set yet, we wait and try to add the "App Installed" event again.
    await addAppInstalledEvent();
  }, 500);
};

/**
 * Handles the onInstalled event.
 *
 * @param params - Array containing a single installation details object.
 * @param params."0"
 */
async function handleOnInstalled([details]: [Runtime.OnInstalledDetailsType]) {
  if (details.reason === 'install') {
    await onInstall();
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
async function onInstall() {
  log.debug('First install detected');
  if (!process.env.IN_TEST && !process.env.METAMASK_DEBUG) {
    platform.openExtensionInBrowser();
  }
  await addAppInstalledEvent();
}

/**
 * Trigger actions that should happen only when an update is available
 *
 * @param details - Event details from runtime.onUpdateAvailable (e.g. details.version)
 */
async function onUpdateAvailable(
  details: Runtime.OnUpdateAvailableDetailsType,
) {
  await isInitialized;
  log.info('An update is available', details?.version);
  controller.appStateController.setPendingExtensionVersion(
    details?.version ?? null,
  );
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
          controller
            .handleDefiReferral(
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

// Sidepanel-specific functionality
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browserWithSidePanel = browser as any;

async function applyToolbarSidePanelBehavior() {
  if (!browserWithSidePanel?.sidePanel?.setPanelBehavior) {
    return;
  }
  const useSidePanelAsDefault =
    controller?.preferencesController?.state?.preferences
      ?.useSidePanelAsDefault ?? true;
  await browserWithSidePanel.sidePanel.setPanelBehavior({
    openPanelOnActionClick: useSidePanelAsDefault,
  });
}

/**
 * Sets initial side panel toolbar behavior after startup, then subscribes only to
 * `useSidePanelAsDefault` changes (not every PreferencesController update).
 */
const setupSidePanelToolbarBehavior = async () => {
  if (!browserWithSidePanel?.sidePanel) {
    return;
  }

  try {
    await isInitialized;
    await applyToolbarSidePanelBehavior();

    controller?.controllerMessenger?.subscribe(
      'PreferencesController:stateChange',
      (useSidePanelAsDefault: boolean) => {
        if (browserWithSidePanel?.sidePanel?.setPanelBehavior) {
          browserWithSidePanel.sidePanel
            .setPanelBehavior({
              openPanelOnActionClick: useSidePanelAsDefault,
            })
            .catch((error: unknown) =>
              console.error('Error updating panel behavior:', error),
            );
        }
      },
      (preferencesControllerState: {
        preferences?: { useSidePanelAsDefault?: boolean };
      }) =>
        preferencesControllerState?.preferences?.useSidePanelAsDefault ?? true,
    );
  } catch (error) {
    console.error('Error setting side panel toolbar behavior:', error);
  }
};

setupSidePanelToolbarBehavior();

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
    if (id === undefined) {
      return {};
    }
    controller.appStateController.setAppActiveTab({
      id,
      title: title ?? '',
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
      subjectType: SubjectType.Website,
    });
  } catch (error) {
    // Ignore errors from tabs that don't exist or can't be accessed
    console.log(
      'Error in tabs.onActivated listener:',
      (error as Error).message,
    );
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
    if (
      (urlChanged || statusComplete) &&
      isActuallyActive &&
      id !== undefined
    ) {
      // Update the app active tab state
      controller.appStateController.setAppActiveTab({
        id,
        title: title ?? '',
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
        subjectType: SubjectType.Website,
      });
    }
  } catch (error) {
    // Ignore errors from tabs that don't exist or can't be accessed
    console.log('Error in tabs.onUpdated listener:', (error as Error).message);
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

function setupSentryGetStateGlobal(store: MetamaskController) {
  global.stateHooks.getSentryAppState = function () {
    const backgroundState = store.getState();
    return maskObject(backgroundState, SENTRY_BACKGROUND_STATE);
  };
}

/**
 *
 * @param backup
 */
async function initBackground(backup: Backup | null) {
  onNavigateToTab();
  try {
    await initialize(backup);
    if (process.env.IN_TEST) {
      // Send message to offscreen document
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((browser as any).offscreen) {
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

if (inTest) {
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
}
