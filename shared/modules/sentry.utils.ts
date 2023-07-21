import * as Sentry from '@sentry/browser';
import { Dedupe } from '@sentry/browser';
import { ExtraErrorData } from '@sentry/integrations';
import { Breadcrumb, Event as EventType } from '@sentry/types';
import { SentryDebugInfo } from '../../types/global';
import extractEthjsErrorMessage from '../../app/scripts/lib/extractEthjsErrorMessage';
import { FilterEvents } from '../../app/scripts/lib/sentry-filter-events';

export const ERROR_URL_ALLOWLIST = {
  CRYPTOCOMPARE: 'cryptocompare.com',
  COINGECKO: 'coingecko.com',
  ETHERSCAN: 'etherscan.io',
  CODEFI: 'codefi.network',
  SEGMENT: 'segment.io',
};

/* eslint-disable prefer-destructuring */
// Destructuring breaks the inlining of the environment variables
const METAMASK_DEBUG = process.env.METAMASK_DEBUG;
const METAMASK_ENVIRONMENT = process.env.METAMASK_ENVIRONMENT;
const SENTRY_DSN_DEV =
  process.env.SENTRY_DSN_DEV ||
  'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496';
const METAMASK_BUILD_TYPE = process.env.METAMASK_BUILD_TYPE;
const IN_TEST = process.env.IN_TEST;
const METAMASK_VERSION = process.env.METAMASK_VERSION;
/* eslint-enable prefer-destructuring */

const SENTRY_ENVIRONMENT_STRING =
  METAMASK_BUILD_TYPE === 'main'
    ? METAMASK_ENVIRONMENT
    : `${METAMASK_ENVIRONMENT}-${METAMASK_BUILD_TYPE}`;

export interface SentryDebugState {
  gas: {
    customData: {
      price: string | null;
      limit: string | null;
    };
  };
  history: {
    mostRecentOverviewPage: string;
  };
  metamask: {
    alertEnabledness: {
      unconnectedAccount: boolean;
      web3ShimUsage: boolean;
    };
    completedOnboarding: boolean;
    connectedStatusPopoverHasBeenShown: boolean;
    conversionDate: number;
    conversionRate: number;
    currentBlockGasLimit: string;
    currentCurrency: string;
    currentLocale: string;
    // Note to self, this below key exists in the metamask duck but isn't in
    // the background state. its set in metamask state and passed around as an
    // ephemeral value which is probably better suited for a different slice.
    customNonceValue: string;
    defaultHomeActiveTabName: string | null;
    desktopEnabled: boolean;
    featureFlags: Record<string, boolean>;
    firstTimeFlowType: string;
    forgottenPassword: boolean;
    incomingTxLastFetchedBlockByChainId: Record<string, number>;
    ipfsGateway: string;
    isAccountMenuOpen: boolean;
    isInitialized: boolean;
    isUnlocked: boolean;
    metaMetricsId: string;
    nativeCurrency: string;
    networkId: string;
    networkStatus: string;
    nextNonce: number;
    participateInMetaMetrics: boolean;
    preferences: {
      autoLockTimeLimit?: number;
      showFiatInTestnets: boolean;
      showTestNetworks: boolean;
      useNativeCurrencyAsPrimaryCurrency: boolean;
      hideZeroBalanceTokens: boolean;
    };
    providerConfig: {
      nickname: string;
      ticker: string;
      type: string;
    };
    seedPhraseBackedUp: boolean;
    unapprovedDecryptMsgCount: number;
    unapprovedEncryptionPublicKeyMsgCount: number;
    unapprovedMsgCount: number;
    unapprovedPersonalMsgCount: number;
    unapprovedTypedMessagesCount: number;
    useBlockie: boolean;
    useNonceField: boolean;
    usePhishDetect: boolean;
    welcomeScreenSeen: boolean;
  };
  unconnectedAccount: {
    state: string;
  };
}

// This describes the subset of Redux state attached to errors sent to Sentry
// These properties have some potential to be useful for debugging, and they do
// not contain any identifiable information.
export const SENTRY_STATE = {
  gas: true,
  history: true,
  metamask: {
    alertEnabledness: true,
    completedOnboarding: true,
    connectedStatusPopoverHasBeenShown: true,
    conversionDate: true,
    conversionRate: true,
    currentBlockGasLimit: true,
    currentCurrency: true,
    currentLocale: true,
    customNonceValue: true,
    defaultHomeActiveTabName: true,
    desktopEnabled: true,
    featureFlags: true,
    firstTimeFlowType: true,
    forgottenPassword: true,
    incomingTxLastFetchedBlockByChainId: true,
    ipfsGateway: true,
    isAccountMenuOpen: true,
    isInitialized: true,
    isUnlocked: true,
    metaMetricsId: true,
    nativeCurrency: true,
    networkId: true,
    networkStatus: true,
    nextNonce: true,
    participateInMetaMetrics: true,
    preferences: true,
    providerConfig: {
      nickname: true,
      ticker: true,
      type: true,
    },
    seedPhraseBackedUp: true,
    unapprovedDecryptMsgCount: true,
    unapprovedEncryptionPublicKeyMsgCount: true,
    unapprovedMsgCount: true,
    unapprovedPersonalMsgCount: true,
    unapprovedTypedMessagesCount: true,
    useBlockie: true,
    useNonceField: true,
    usePhishDetect: true,
    welcomeScreenSeen: true,
  },
  unconnectedAccount: true,
};

function getSentryTarget() {
  if (METAMASK_ENVIRONMENT === 'production') {
    if (!process.env.SENTRY_DSN) {
      throw new Error(
        `Missing SENTRY_DSN environment variable in production environment`,
      );
    }
    console.log(
      `Setting up Sentry Remote Error Reporting for '${SENTRY_ENVIRONMENT_STRING}': SENTRY_DSN`,
    );
    return process.env.SENTRY_DSN;
  }
  console.log(
    `Setting up Sentry Remote Error Reporting for '${SENTRY_ENVIRONMENT_STRING}': SENTRY_DSN_DEV`,
  );
  return SENTRY_DSN_DEV;
}

function getSentryOptions({ enabled }: { enabled?: boolean } = {}) {
  const sentryTarget = getSentryTarget();

  const getSentryDebugInfo = () => global.stateHooks?.getSentryState?.() ?? {};

  /**
   * A function that returns whether MetaMetrics is enabled. This should also
   * return `false` if state has not yet been initialzed.
   *
   * @returns `true` if MetaMask's state has been initialized, and MetaMetrics
   * is enabled, `false` otherwise.
   */
  function getMetaMetricsEnabled() {
    const sentryDebugInfo = getSentryDebugInfo();
    return sentryDebugInfo?.store?.metamask?.participateInMetaMetrics ?? false;
  }

  return {
    dsn: sentryTarget,
    debug: true,
    enabled: typeof enabled === 'undefined' ? true : enabled,
    environment: SENTRY_ENVIRONMENT_STRING,
    integrations: [
      new FilterEvents({ getMetaMetricsEnabled }),
      new Dedupe(),
      new ExtraErrorData(),
    ],
    release: process.env.METAMASK_VERSION,
    beforeSend: (report: EventType) =>
      rewriteReport(report, getSentryDebugInfo),
    beforeBreadcrumb: beforeBreadcrumb(getSentryDebugInfo),
  };
}

export function toggleSentry(participateInMetaMetrics = false) {
  console.log('begin toggle');
  const hub = global.sentry?.getCurrentHub?.();
  if (!hub) {
    console.log('hub not active');
    return;
  }
  const isEnabled = hub.getClient?.()?.getOptions?.().enabled ?? false;
  console.log('isSentryEnabled', isEnabled);
  if (participateInMetaMetrics === true && isEnabled === false) {
    console.log('init with enabled true');
    global.sentry.init(getSentryOptions({ enabled: true }));
  } else if (participateInMetaMetrics === false && isEnabled === true) {
    console.log('init with enabled false');
    global.sentry.init({ enabled: false });
  }
}

export function initializeSentry():
  | (typeof Sentry & {
      toggleSentry: (participateInMetaMetrics: boolean) => void;
    })
  | undefined {
  console.log('begin init');
  if (!METAMASK_VERSION) {
    throw new Error('Missing release');
  } else if (METAMASK_DEBUG && !IN_TEST) {
    /**
     * Workaround until the following issue is resolved
     * https://github.com/MetaMask/metamask-extension/issues/15691
     * The IN_TEST condition allows the e2e tests to run with both
     * yarn start:test and yarn build:test
     */
    return undefined;
  }

  Sentry.init(getSentryOptions());
  return {
    ...Sentry,
    toggleSentry,
  };
}

/**
 * Receives a string and returns that string if it is a
 * regex match for a url with a `chrome-extension` or `moz-extension`
 * protocol, and an empty string otherwise.
 *
 * @param url - The URL to check.
 * @returns An empty string if the URL was internal, or the unmodified URL otherwise.
 */
function hideUrlIfNotInternal(url: string) {
  const re = /^(chrome-extension|moz-extension):\/\//u;
  if (!url.match(re)) {
    return '';
  }
  return url;
}

/**
 * Returns a method that handles the Sentry breadcrumb using a specific method to get the extension state
 *
 * @param getState - A method that returns the state of the extension
 * @returns A method that modifies a Sentry breadcrumb object
 */
export function beforeBreadcrumb(getState: () => SentryDebugInfo) {
  return (breadcrumb: Breadcrumb) => {
    if (getState) {
      const appState = getState();
      if (
        Object.values(appState).length &&
        (!appState?.store?.metamask?.participateInMetaMetrics ||
          !appState?.store?.metamask?.completedOnboarding ||
          breadcrumb?.category === 'ui.input')
      ) {
        return null;
      }
    } else {
      return null;
    }
    const newBreadcrumb = removeUrlsFromBreadCrumb(breadcrumb);
    return newBreadcrumb;
  };
}

/**
 * Receives a Sentry breadcrumb object and potentially removes urls
 * from its `data` property, it particular those possibly found at
 * data.from, data.to and data.url
 *
 * @param breadcrumb - A Sentry breadcrumb object: https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/
 * @returns A modified Sentry breadcrumb object.
 */
export function removeUrlsFromBreadCrumb(breadcrumb: Breadcrumb) {
  if (breadcrumb?.data?.url) {
    breadcrumb.data.url = hideUrlIfNotInternal(breadcrumb.data.url);
  }
  if (breadcrumb?.data?.to) {
    breadcrumb.data.to = hideUrlIfNotInternal(breadcrumb.data.to);
  }
  if (breadcrumb?.data?.from) {
    breadcrumb.data.from = hideUrlIfNotInternal(breadcrumb.data.from);
  }
  return breadcrumb;
}

/**
 * Receives a Sentry event object and modifies it before the
 * error is sent to Sentry. Modifications include both sanitization
 * of data via helper methods and addition of state data from the
 * return value of the second parameter passed to the function.
 *
 * @param report - A Sentry event object: https://develop.sentry.dev/sdk/event-payloads/
 * @param getState - A function that should return an object representing some amount
 * of app state that we wish to submit with our error reports
 * @returns A modified Sentry event object.
 */
export function rewriteReport(
  report: EventType,
  getState: () => SentryDebugInfo,
) {
  try {
    // simplify certain complex error messages (e.g. Ethjs)
    simplifyErrorMessages(report);
    // remove urls from error message
    sanitizeUrlsFromErrorMessages(report);
    // Remove evm addresses from error message.
    // Note that this is redundent with data scrubbing we do within our sentry dashboard,
    // but putting the code here as well gives public visibility to how we are handling
    // privacy with respect to sentry.
    sanitizeAddressesFromErrorMessages(report);
    // modify report urls
    rewriteReportUrls(report);
    // append app state
    if (getState) {
      const appState = getState();
      if (!report.extra) {
        report.extra = {};
      }
      report.extra.appState = appState;
    }
  } catch (err) {
    console.warn(err);
  }
  return report;
}

/**
 * Receives a Sentry event object and modifies it so that urls are removed from any of its
 * error messages.
 *
 * @param report - the report to modify
 */
function sanitizeUrlsFromErrorMessages(report: EventType) {
  rewriteErrorMessages(report, (errorMessage) => {
    let newErrorMessage = errorMessage;
    const re = /(([-.+a-zA-Z]+:\/\/)|(www\.))\S+[@:.]\S+/gu;
    const urlsInMessage = newErrorMessage.match(re) || [];
    urlsInMessage.forEach((url) => {
      try {
        const urlObj = new URL(url);
        const { hostname } = urlObj;
        if (
          !Object.values(ERROR_URL_ALLOWLIST).some(
            (allowedHostname) =>
              hostname === allowedHostname ||
              hostname.endsWith(`.${allowedHostname}`),
          )
        ) {
          newErrorMessage = newErrorMessage.replace(url, '**');
        }
      } catch (e) {
        newErrorMessage = newErrorMessage.replace(url, '**');
      }
    });
    return newErrorMessage;
  });
}

/**
 * Receives a Sentry event object and modifies it so that ethereum addresses are removed from
 * any of its error messages.
 *
 * @param report - the report to modify
 */
function sanitizeAddressesFromErrorMessages(report: EventType) {
  rewriteErrorMessages(report, (errorMessage) => {
    const newErrorMessage = errorMessage.replace(/0x[A-Fa-f0-9]{40}/u, '0x**');
    return newErrorMessage;
  });
}

function simplifyErrorMessages(report: EventType) {
  rewriteErrorMessages(report, (errorMessage: string) => {
    // simplify ethjs error messages
    let simplifiedErrorMessage = extractEthjsErrorMessage(errorMessage);
    // simplify 'Transaction Failed: known transaction'
    if (
      simplifiedErrorMessage.indexOf(
        'Transaction Failed: known transaction',
      ) === 0
    ) {
      // cut the hash from the error message
      simplifiedErrorMessage = 'Transaction Failed: known transaction';
    }
    return simplifiedErrorMessage;
  });
}

function rewriteErrorMessages(
  report: EventType,
  rewriteFn: (errorMessage: string) => string,
) {
  // rewrite top level message
  if (typeof report.message === 'string') {
    report.message = rewriteFn(report.message);
  }
  // rewrite each exception message
  if (report.exception?.values) {
    report.exception.values.forEach((item) => {
      if (typeof item.value === 'string') {
        item.value = rewriteFn(item.value);
      }
    });
  }
}

function rewriteReportUrls(report: EventType) {
  if (report.request?.url) {
    // update request url
    report.request.url = toMetamaskUrl(report.request.url);
  }

  // update exception stack trace
  if (report.exception?.values) {
    report.exception.values.forEach((item) => {
      if (item.stacktrace) {
        item.stacktrace?.frames?.forEach((frame) => {
          frame.filename = toMetamaskUrl(frame.filename);
        });
      }
    });
  }
}

export function toMetamaskUrl(origUrl?: string) {
  if (!globalThis.location?.origin) {
    return origUrl;
  }

  const filePath = origUrl?.split(globalThis.location.origin)[1];
  if (!filePath) {
    return origUrl;
  }
  const metamaskUrl = `metamask${filePath}`;
  return metamaskUrl;
}
