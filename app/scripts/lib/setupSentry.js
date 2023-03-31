import * as Sentry from '@sentry/browser';
import { Dedupe, ExtraErrorData } from '@sentry/integrations';

import { BuildType } from '../../../shared/constants/app';
import { FilterEvents } from './sentry-filter-events';
import extractEthjsErrorMessage from './extractEthjsErrorMessage';

/* eslint-disable prefer-destructuring */
// Destructuring breaks the inlining of the environment variables
const METAMASK_DEBUG = process.env.METAMASK_DEBUG;
const METAMASK_ENVIRONMENT = process.env.METAMASK_ENVIRONMENT;
const SENTRY_DSN_DEV =
  process.env.SENTRY_DSN_DEV ||
  'https://f59f3dd640d2429d9d0e2445a87ea8e1@sentry.io/273496';
const METAMASK_BUILD_TYPE = process.env.METAMASK_BUILD_TYPE;
const IN_TEST = process.env.IN_TEST;
/* eslint-enable prefer-destructuring */

export const ERROR_URL_ALLOWLIST = {
  CRYPTOCOMPARE: 'cryptocompare.com',
  COINGECKO: 'coingecko.com',
  ETHERSCAN: 'etherscan.io',
  CODEFI: 'codefi.network',
  SEGMENT: 'segment.io',
};

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
    provider: {
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

export default function setupSentry({ release, getState }) {
  if (!release) {
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

  const environment =
    METAMASK_BUILD_TYPE === BuildType.main
      ? METAMASK_ENVIRONMENT
      : `${METAMASK_ENVIRONMENT}-${METAMASK_BUILD_TYPE}`;

  let sentryTarget;
  if (METAMASK_ENVIRONMENT === 'production') {
    if (!process.env.SENTRY_DSN) {
      throw new Error(
        `Missing SENTRY_DSN environment variable in production environment`,
      );
    }
    console.log(
      `Setting up Sentry Remote Error Reporting for '${environment}': SENTRY_DSN`,
    );
    sentryTarget = process.env.SENTRY_DSN;
  } else {
    console.log(
      `Setting up Sentry Remote Error Reporting for '${environment}': SENTRY_DSN_DEV`,
    );
    sentryTarget = SENTRY_DSN_DEV;
  }

  /**
   * A function that returns whether MetaMetrics is enabled. This should also
   * return `false` if state has not yet been initialzed.
   *
   * @returns `true` if MetaMask's state has been initialized, and MetaMetrics
   * is enabled, `false` otherwise.
   */
  function getMetaMetricsEnabled() {
    if (getState) {
      const appState = getState();
      if (!appState?.store?.metamask?.participateInMetaMetrics) {
        return false;
      }
    } else {
      return false;
    }
    return true;
  }

  Sentry.init({
    dsn: sentryTarget,
    debug: METAMASK_DEBUG,
    environment,
    integrations: [
      new FilterEvents({ getMetaMetricsEnabled }),
      new Dedupe(),
      new ExtraErrorData(),
    ],
    release,
    beforeSend: (report) => rewriteReport(report, getState),
    beforeBreadcrumb: beforeBreadcrumb(getState),
  });

  return Sentry;
}

/**
 * Receives a string and returns that string if it is a
 * regex match for a url with a `chrome-extension` or `moz-extension`
 * protocol, and an empty string otherwise.
 *
 * @param {string} url - The URL to check.
 * @returns {string} An empty string if the URL was internal, or the unmodified URL otherwise.
 */
function hideUrlIfNotInternal(url) {
  const re = /^(chrome-extension|moz-extension):\/\//u;
  if (!url.match(re)) {
    return '';
  }
  return url;
}

/**
 * Returns a method that handles the Sentry breadcrumb using a specific method to get the extension state
 *
 * @param {Function} getState - A method that returns the state of the extension
 * @returns {(breadcrumb: object) => object} A method that modifies a Sentry breadcrumb object
 */
export function beforeBreadcrumb(getState) {
  return (breadcrumb) => {
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
 * @param {object} breadcrumb - A Sentry breadcrumb object: https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/
 * @returns {object} A modified Sentry breadcrumb object.
 */
export function removeUrlsFromBreadCrumb(breadcrumb) {
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
 * @param {object} report - A Sentry event object: https://develop.sentry.dev/sdk/event-payloads/
 * @param {Function} getState - A function that should return an object representing some amount
 * of app state that we wish to submit with our error reports
 * @returns {object} A modified Sentry event object.
 */
export function rewriteReport(report, getState) {
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
 * @param {object} report - the report to modify
 */
function sanitizeUrlsFromErrorMessages(report) {
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
 * @param {object} report - the report to modify
 */
function sanitizeAddressesFromErrorMessages(report) {
  rewriteErrorMessages(report, (errorMessage) => {
    const newErrorMessage = errorMessage.replace(/0x[A-Fa-f0-9]{40}/u, '0x**');
    return newErrorMessage;
  });
}

function simplifyErrorMessages(report) {
  rewriteErrorMessages(report, (errorMessage) => {
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

function rewriteErrorMessages(report, rewriteFn) {
  // rewrite top level message
  if (typeof report.message === 'string') {
    report.message = rewriteFn(report.message);
  }
  // rewrite each exception message
  if (report.exception && report.exception.values) {
    report.exception.values.forEach((item) => {
      if (typeof item.value === 'string') {
        item.value = rewriteFn(item.value);
      }
    });
  }
}

function rewriteReportUrls(report) {
  if (report.request?.url) {
    // update request url
    report.request.url = toMetamaskUrl(report.request.url);
  }

  // update exception stack trace
  if (report.exception && report.exception.values) {
    report.exception.values.forEach((item) => {
      if (item.stacktrace) {
        item.stacktrace.frames.forEach((frame) => {
          frame.filename = toMetamaskUrl(frame.filename);
        });
      }
    });
  }
}

function toMetamaskUrl(origUrl) {
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
