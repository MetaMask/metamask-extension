/**
 * @file The entry point for the web extension singleton process.
 */

// Disabled to allow setting up initial state hooks first

// This import sets up global functions required for Sentry to function.
// It must be run first in case an error is thrown later during initialization.
import './lib/setup-initial-state-hooks';

import EventEmitter from 'events';
import { finished, pipeline } from 'readable-stream';
import debounce from 'debounce-stream';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import { storeAsStream } from '@metamask/obs-store';
import { isObject } from '@metamask/utils';
import { ApprovalType } from '@metamask/controller-utils';
import PortStream from 'extension-port-stream';

import { providerErrors } from '@metamask/rpc-errors';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { NotificationServicesController } from '@metamask/notification-services-controller';

import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  EXTENSION_MESSAGES,
  PLATFORM_FIREFOX,
  MESSAGE_TYPE,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
} from '../../shared/constants/app';
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
import { FIXTURE_STATE_METADATA_VERSION } from '../../test/e2e/default-fixture';
import { getSocketBackgroundToMocha } from '../../test/e2e/background-socket/socket-background-to-mocha';
import {
  OffscreenCommunicationTarget,
  OffscreenCommunicationEvents,
} from '../../shared/constants/offscreen-communication';
import {
  FakeLedgerBridge,
  FakeTrezorBridge,
} from '../../test/stub/keyring-bridge';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { addNonceToCsp } from '../../shared/modules/add-nonce-to-csp';
import { checkURLForProviderInjection } from '../../shared/modules/provider-injection';
import migrations from './migrations';
import Migrator from './lib/migrator';
import ExtensionPlatform from './platforms/extension';
import LocalStore from './lib/local-store';
import ReadOnlyNetworkStore from './lib/network-store';
import { SENTRY_BACKGROUND_STATE } from './constants/sentry-state';

import createStreamSink from './lib/createStreamSink';
import NotificationManager, {
  NOTIFICATION_MANAGER_EVENTS,
} from './lib/notification-manager';
import MetamaskController, {
  METAMASK_CONTROLLER_EVENTS,
} from './metamask-controller';
import rawFirstTimeState from './first-time-state';
import getFirstPreferredLangCode from './lib/get-first-preferred-lang-code';
import getObjStructure from './lib/getObjStructure';
import setupEnsIpfsResolver from './lib/ens-ipfs/setup';
import {
  deferredPromise,
  getPlatform,
  shouldEmitDappViewedEvent,
} from './lib/util';
import { generateWalletState } from './fixtures/generate-wallet-state';
import { createOffscreen } from './offscreen';

/* eslint-enable import/first */

import { COOKIE_ID_MARKETING_WHITELIST_ORIGINS } from './constants/marketing-site-whitelist';

// eslint-disable-next-line @metamask/design-tokens/color-no-hex
const BADGE_COLOR_APPROVAL = '#0376C9';
// eslint-disable-next-line @metamask/design-tokens/color-no-hex
const BADGE_COLOR_NOTIFICATION = '#D73847';
const BADGE_MAX_COUNT = 9;

// Setup global hook for improved Sentry state snapshots during initialization
const inTest = process.env.IN_TEST;
const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();
global.stateHooks.getMostRecentPersistedState = () =>
  localStore.mostRecentRetrievedState;

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

let openPopupCount = 0;
let notificationIsOpen = false;
let uiIsTriggering = false;
const openMetamaskTabsIDs = {};
const requestAccountTabIds = {};
let controller;
let versionedData;
const tabOriginMapping = {};

if (inTest || process.env.METAMASK_DEBUG) {
  global.stateHooks.metamaskGetState = localStore.get.bind(localStore);
}

const phishingPageUrl = new URL(process.env.PHISHING_WARNING_PAGE_URL);

// normalized (adds a trailing slash to the end of the domain if it's missing)
// the URL once and reuse it:
const phishingPageHref = phishingPageUrl.toString();

const ONE_SECOND_IN_MILLISECONDS = 1_000;
// Timeout for initializing phishing warning page.
const PHISHING_WARNING_PAGE_TIMEOUT = ONE_SECOND_IN_MILLISECONDS;

// Event emitter for state persistence
export const statePersistenceEvents = new EventEmitter();

/**
 * This deferred Promise is used to track whether initialization has finished.
 *
 * It is very important to ensure that `resolveInitialization` is *always*
 * called once initialization has completed, and that `rejectInitialization` is
 * called if initialization fails in an unrecoverable way.
 */
const {
  promise: isInitialized,
  resolve: resolveInitialization,
  reject: rejectInitialization,
} = deferredPromise();

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
  async function redirectTab(tabId, url) {
    try {
      return await browser.tabs.update(tabId, {
        url,
      });
    } catch (error) {
      return sentry?.captureException(error);
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
        // compare normalized URLs
        new URL(details.initiator).host === phishingPageUrl.host
      ) {
        return {};
      }

      const { hostname, href, searchParams } = new URL(details.url);
      if (inTest) {
        if (searchParams.has('IN_TEST_BYPASS_EARLY_PHISHING_DETECTION')) {
          // this is a test page that needs to bypass early phishing detection
          return {};
        }
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
      let blockedUrl = hostname;
      if (phishingTestResponse?.result && blockedRequestResponse.result) {
        blockReason = `${phishingTestResponse.type} and ${blockedRequestResponse.type}`;
      } else if (phishingTestResponse?.result) {
        blockReason = phishingTestResponse.type;
      } else {
        blockReason = blockedRequestResponse.type;
        blockedUrl = details.initiator;
      }

      theController.metaMetricsController.trackEvent({
        // should we differentiate between background redirection and content script redirection?
        event: MetaMetricsEventName.PhishingPageDisplayed,
        category: MetaMetricsEventCategory.Phishing,
        properties: {
          url: blockedUrl,
          referrer: {
            url: blockedUrl,
          },
          reason: blockReason,
          requestDomain: blockedRequestResponse.result ? hostname : undefined,
        },
      });
      const querystring = new URLSearchParams({ hostname, href });
      const redirectUrl = new URL(phishingPageHref);
      redirectUrl.hash = querystring.toString();
      const redirectHref = redirectUrl.toString();

      // blocking is better than tab redirection, as blocking will prevent
      // the browser from loading the page at all
      if (isManifestV2) {
        if (details.type === 'sub_frame') {
          // redirect the entire tab to the
          // phishing warning page instead.
          redirectTab(details.tabId, redirectHref);
          // don't let the sub_frame load at all
          return { cancel: true };
        }
        // redirect the whole tab
        return { redirectUrl: redirectHref };
      }
      // redirect the whole tab (even if it's a sub_frame request)
      redirectTab(details.tabId, redirectHref);
      return {};
    },
    {
      urls: ['http://*/*', 'https://*/*'],
    },
    isManifestV2 ? ['blocking'] : [],
  );
}

/**
 * Overrides the Content-Security-Policy (CSP) header by adding a nonce to the `script-src` directive.
 * This is a workaround for [Bug #1446231](https://bugzilla.mozilla.org/show_bug.cgi?id=1446231),
 * which involves overriding the page CSP for inline script nodes injected by extension content scripts.
 */
function overrideContentSecurityPolicyHeader() {
  // The extension url is unique per install on Firefox, so we can safely add it as a nonce to the CSP header
  const nonce = btoa(browser.runtime.getURL('/'));
  browser.webRequest.onHeadersReceived.addListener(
    ({ responseHeaders, url }) => {
      // Check whether inpage.js is going to be injected into the page or not.
      // There is no reason to modify the headers if we are not injecting inpage.js.
      const isInjected = checkURLForProviderInjection(new URL(url));

      // Check if the user has enabled the overrideContentSecurityPolicyHeader preference
      const isEnabled =
        controller.preferencesController.state
          .overrideContentSecurityPolicyHeader;

      if (isInjected && isEnabled) {
        for (const header of responseHeaders) {
          if (header.name.toLowerCase() === 'content-security-policy') {
            header.value = addNonceToCsp(header.value, nonce);
          }
        }
      }

      return { responseHeaders };
    },
    { types: ['main_frame', 'sub_frame'], urls: ['http://*/*', 'https://*/*'] },
    ['blocking', 'responseHeaders'],
  );
}

// These are set after initialization
let connectRemote;
let connectExternalExtension;
let connectExternalCaip;

browser.runtime.onConnect.addListener(async (...args) => {
  // Queue up connection attempts here, waiting until after initialization
  await isInitialized;

  // This is set in `setupController`, which is called as part of initialization
  connectRemote(...args);
});
browser.runtime.onConnectExternal.addListener(async (...args) => {
  // Queue up connection attempts here, waiting until after initialization
  await isInitialized;
  // This is set in `setupController`, which is called as part of initialization
  const port = args[0];

  if (port.sender.tab?.id && process.env.BARAD_DUR) {
    connectExternalCaip(...args);
  } else {
    connectExternalExtension(...args);
  }
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
 * @property {object} accounts - An object mapping lower-case hex addresses to objects with "balance" and "address" keys, both storing hex string values.
 * @property {object} accountsByChainId - An object mapping lower-case hex addresses to objects with "balance" and "address" keys, both storing hex string values keyed by chain id.
 * @property {hex} currentBlockGasLimit - The most recently seen block gas limit, in a lower case hex prefixed string.
 * @property {object} currentBlockGasLimitByChainId - The most recently seen block gas limit, in a lower case hex prefixed string keyed by chain id.
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
 * @returns {Promise} Setup complete.
 */
async function initialize() {
  try {
    const offscreenPromise = isManifestV3 ? createOffscreen() : null;

    const initData = await loadStateFromPersistence();

    const initState = initData.data;
    const initLangCode = await getFirstPreferredLangCode();

    let isFirstMetaMaskControllerSetup;

    // We only want to start this if we are running a test build, not for the release build.
    // `navigator.webdriver` is true if Selenium, Puppeteer, or Playwright are running.
    // In MV3, the Service Worker sees `navigator.webdriver` as `undefined`, so this will trigger from
    // an Offscreen Document message instead. Because it's a singleton class, it's safe to start multiple times.
    if (process.env.IN_TEST && window.navigator?.webdriver) {
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
            trezorBridge: FakeTrezorBridge,
            ledgerBridge: FakeLedgerBridge,
          },
        }
      : {};

    setupController(
      initState,
      initLangCode,
      overrides,
      isFirstMetaMaskControllerSetup,
      initData.meta,
      offscreenPromise,
    );

    // `setupController` sets up the `controller` object, so we can use it now:
    maybeDetectPhishing(controller);

    if (!isManifestV3) {
      await loadPhishingWarningPage();
      // Workaround for Bug #1446231 to override page CSP for inline script nodes injected by extension content scripts
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1446231
      if (getPlatform() === PLATFORM_FIREFOX) {
        overrideContentSecurityPolicyHeader();
      }
    }
    await sendReadyMessageToTabs();
    log.info('MetaMask initialization complete.');

    resolveInitialization();
  } catch (error) {
    rejectInitialization(error);
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
 * @returns {Promise<MetaMaskState>} Last data emitted from previous instance of MetaMask.
 */
export async function loadStateFromPersistence() {
  // migrations
  const migrator = new Migrator({
    migrations,
    defaultVersion: process.env.WITH_STATE
      ? FIXTURE_STATE_METADATA_VERSION
      : null,
  });
  migrator.on('error', console.warn);

  if (process.env.WITH_STATE) {
    const stateOverrides = await generateWalletState();
    firstTimeState = { ...firstTimeState, ...stateOverrides };
  }

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
  localStore.setMetadata(versionedData.meta);

  // write to disk
  localStore.set(versionedData.data);

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

  const permissions = controller.controllerMessenger.call(
    'PermissionController:getPermissions',
    origin,
  );
  const numberOfConnectedAccounts =
    permissions?.eth_accounts?.caveats[0]?.value.length;
  if (!numberOfConnectedAccounts) {
    return;
  }

  const preferencesState = controller.controllerMessenger.call(
    'PreferencesController:getState',
  );
  const numberOfTotalAccounts = Object.keys(preferencesState.identities).length;

  controller.metaMetricsController.trackEvent({
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
  });
}

/**
 * Track dapp connection when loaded and permissioned
 *
 * @param {Port} remotePort - The port provided by a new context.
 */
function trackDappView(remotePort) {
  if (!remotePort.sender || !remotePort.sender.tab || !remotePort.sender.url) {
    return;
  }
  const tabId = remotePort.sender.tab.id;
  const url = new URL(remotePort.sender.url);
  const { origin } = url;

  // store the orgin to corresponding tab so it can provide infor for onActivated listener
  if (!Object.keys(tabOriginMapping).includes(tabId)) {
    tabOriginMapping[tabId] = origin;
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
 */
export function setupController(
  initState,
  initLangCode,
  overrides,
  isFirstMetaMaskControllerSetup,
  stateMetadata,
  offscreenPromise,
) {
  //
  // MetaMask Controller
  //
  controller = new MetamaskController({
    infuraProjectId: process.env.INFURA_PROJECT_ID,
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
    localStore,
    overrides,
    isFirstMetaMaskControllerSetup,
    currentMigrationVersion: stateMetadata.version,
    featureFlags: {},
    offscreenPromise,
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

  // setup state persistence
  pipeline(
    storeAsStream(controller.store),
    debounce(1000),
    createStreamSink(async (state) => {
      await localStore.set(state);
      statePersistenceEvents.emit('state-persisted', state);
    }),
    (error) => {
      log.error('MetaMask - Persistence pipeline failed', error);
    },
  );

  setupSentryGetStateGlobal(controller);

  const isClientOpenStatus = () => {
    return (
      openPopupCount > 0 ||
      Boolean(Object.keys(openMetamaskTabsIDs).length) ||
      notificationIsOpen
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

  /**
   * A runtime.Port object, as provided by the browser:
   *
   * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/Port
   * @typedef Port
   * @type Object
   */

  /**
   * Connects a Port to the MetaMask controller via a multiplexed duplex stream.
   * This method identifies trusted (MetaMask) interfaces, and connects them differently from untrusted (web pages).
   *
   * @param {Port} remotePort - The port provided by a new context.
   */
  connectRemote = async (remotePort) => {
    const processName = remotePort.name;

    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    let isMetaMaskInternalProcess = false;
    const sourcePlatform = getPlatform();
    const senderUrl = remotePort.sender?.url
      ? new URL(remotePort.sender.url)
      : null;

    if (sourcePlatform === PLATFORM_FIREFOX) {
      isMetaMaskInternalProcess = metamaskInternalProcessHash[processName];
    } else {
      isMetaMaskInternalProcess =
        senderUrl?.origin === `chrome-extension://${browser.runtime.id}`;
    }

    if (isMetaMaskInternalProcess) {
      const portStream =
        overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);
      // communication with popup
      controller.isClientOpen = true;
      controller.setupTrustedCommunication(portStream, remotePort.sender);

      // initialize the request to fetch remote feature flags
      controller.remoteFeatureFlagController.updateRemoteFeatureFlags();

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        openPopupCount += 1;
        finished(portStream, () => {
          openPopupCount -= 1;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_POPUP);
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
        overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);
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
          overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);
        controller.setUpCookieHandlerCommunication({
          connectionStream: portStreamForCookieHandlerPage,
        });
      }
      connectExternalExtension(remotePort);
    }
  };

  // communication with page or other extension
  connectExternalExtension = (remotePort) => {
    const portStream =
      overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);
    controller.setupUntrustedCommunicationEip1193({
      connectionStream: portStream,
      sender: remotePort.sender,
    });
  };

  connectExternalCaip = async (remotePort) => {
    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    // this is triggered when a new tab is opened, or origin(url) is changed
    if (remotePort.sender && remotePort.sender.tab && remotePort.sender.url) {
      trackDappView(remotePort);
    }

    const portStream =
      overrides?.getPortStream?.(remotePort) || new PortStream(remotePort);

    controller.setupUntrustedCommunicationCaip({
      connectionStream: portStream,
      sender: remotePort.sender,
    });
  };

  if (overrides?.registerConnectListeners) {
    overrides.registerConnectListeners(connectRemote, connectExternalExtension);
  }

  //
  // User Interface setup
  //
  updateBadge();

  controller.decryptMessageController.hub.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.encryptionPublicKeyController.hub.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.signatureController.hub.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );
  controller.appStateController.on(
    METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE,
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.APPROVAL_STATE_CHANGE,
    updateBadge,
  );

  controller.controllerMessenger.subscribe(
    METAMASK_CONTROLLER_EVENTS.QUEUED_REQUEST_STATE_CHANGE,
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
    const unreadNotificationsCount = getUnreadNotificationsCount();

    let label = '';
    let badgeColor = BADGE_COLOR_APPROVAL;

    if (pendingApprovalCount) {
      label = getBadgeLabel(pendingApprovalCount, BADGE_MAX_COUNT);
    } else if (unreadNotificationsCount > 0) {
      label = getBadgeLabel(unreadNotificationsCount, BADGE_MAX_COUNT);
      badgeColor = BADGE_COLOR_NOTIFICATION;
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
      let pendingApprovalCount =
        controller.appStateController.waitingForUnlock.length +
        controller.approvalController.getTotalApprovalCount();

      if (controller.preferencesController.getUseRequestQueue()) {
        pendingApprovalCount +=
          controller.queuedRequestController.state.queuedRequestCount;
      }
      return pendingApprovalCount;
    } catch (error) {
      console.error('Failed to get pending approval count:', error);
      return 0;
    }
  }

  function getUnreadNotificationsCount() {
    try {
      const { isNotificationServicesEnabled, isFeatureAnnouncementsEnabled } =
        controller.notificationServicesController.state;

      const snapNotificationCount = Object.values(
        controller.notificationServicesController.state
          .metamaskNotificationsList,
      ).filter(
        (notification) =>
          notification.type ===
            NotificationServicesController.Constants.TRIGGER_TYPES.SNAP &&
          notification.readDate === null,
      ).length;

      const featureAnnouncementCount = isFeatureAnnouncementsEnabled
        ? controller.notificationServicesController.state.metamaskNotificationsList.filter(
            (notification) =>
              !notification.isRead &&
              notification.type ===
                NotificationServicesController.Constants.TRIGGER_TYPES
                  .FEATURES_ANNOUNCEMENT,
          ).length
        : 0;

      const walletNotificationCount = isNotificationServicesEnabled
        ? controller.notificationServicesController.state.metamaskNotificationsList.filter(
            (notification) =>
              !notification.isRead &&
              notification.type !==
                NotificationServicesController.Constants.TRIGGER_TYPES
                  .FEATURES_ANNOUNCEMENT &&
              notification.type !==
                NotificationServicesController.Constants.TRIGGER_TYPES.SNAP,
          ).length
        : 0;

      const unreadNotificationsCount =
        snapNotificationCount +
        featureAnnouncementCount +
        walletNotificationCount;

      return unreadNotificationsCount;
    } catch (error) {
      console.error('Failed to get unread notifications count:', error);
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

    // Finally, resolve snap dialog approvals on Flask and reject all the others managed by the ApprovalController.
    Object.values(controller.approvalController.state.pendingApprovals).forEach(
      ({ id, type }) => {
        switch (type) {
          case ApprovalType.SnapDialogAlert:
          case ApprovalType.SnapDialogPrompt:
          case DIALOG_APPROVAL_TYPES.default:
            controller.approvalController.accept(id, null);
            break;
          case ApprovalType.SnapDialogConfirmation:
            controller.approvalController.accept(id, false);
            break;
          ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
          case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation:
          case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval:
          case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect:
            controller.approvalController.accept(id, false);
            break;
          ///: END:ONLY_INCLUDE_IF
          default:
            controller.approvalController.reject(
              id,
              providerErrors.userRejectedRequest(),
            );
            break;
        }
      },
    );
  }

  // Updates the snaps registry and check for newly blocked snaps to block if the user has at least one snap installed that isn't preinstalled.
  if (
    Object.values(controller.snapController.state.snaps).some(
      (snap) => !snap.preinstalled,
    )
  ) {
    controller.snapController.updateBlockedSnaps();
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
    !currentlyActiveMetamaskTab
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

// On first install, open a new tab with MetaMask
async function onInstall() {
  const storeAlreadyExisted = Boolean(await localStore.get());
  // If the store doesn't exist, then this is the first time running this script,
  // and is therefore an install
  if (process.env.IN_TEST) {
    addAppInstalledEvent();
  } else if (!storeAlreadyExisted && !process.env.METAMASK_DEBUG) {
    addAppInstalledEvent();
    platform.openExtensionInBrowser();
  }
  onNavigateToTab();
}

function onNavigateToTab() {
  browser.tabs.onActivated.addListener((onActivatedTab) => {
    if (controller) {
      const { tabId } = onActivatedTab;
      const currentOrigin = tabOriginMapping[tabId];
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
    }
  });
}

function setupSentryGetStateGlobal(store) {
  global.stateHooks.getSentryAppState = function () {
    const backgroundState = store.memStore.getState();
    return maskObject(backgroundState, SENTRY_BACKGROUND_STATE);
  };
}

async function initBackground() {
  await onInstall();
  try {
    await initialize();
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
    localStore.cleanUpMostRecentRetrievedState();
  } catch (error) {
    log.error(error);
  }
}
if (!process.env.SKIP_BACKGROUND_INITIALIZATION) {
  initBackground();
}
