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

const ERROR_URL_ALLOWLIST = [
  'cryptocompare.com',
  'coingecko.com',
  'etherscan.io',
  'codefi.network',
  'segment.io',
];

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
    network: true,
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
    beforeSend: (report) => rewriteReport(report),
    beforeBreadcrumb(breadcrumb) {
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
      return rewriteBreadcrumb(breadcrumb);
    },
  });

  function getProtocolFromURL(url) {
    return new URL(url).protocol;
  }

  function rewriteBreadcrumb(breadcrumb) {
    /** @todo check URL allowlist, exclude URLs not in allowlist */

    if (breadcrumb.data?.url) {
      breadcrumb.data.url = getProtocolFromURL(breadcrumb.data.url);
    }
    if (breadcrumb.data?.to) {
      breadcrumb.data.to = getProtocolFromURL(breadcrumb.data.to);
    }
    if (breadcrumb.data?.from) {
      breadcrumb.data.from = getProtocolFromURL(breadcrumb.data.from);
    }
    return breadcrumb;
  }

  function rewriteReport(report) {
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
      console.error(err);
      throw err;
    }
    return report;
  }

  return Sentry;
}

function sanitizeUrlsFromErrorMessages(report) {
  rewriteErrorMessages(report, (errorMessage) => {
    const re =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gu;
    const urlsInMessage = errorMessage.match(re) || [];
    urlsInMessage.forEach((url) => {
      if (!ERROR_URL_ALLOWLIST.some((allowedUrl) => url.match(allowedUrl))) {
        errorMessage.replace(url, '**');
      }
    });
    return errorMessage;
  });
}

function sanitizeAddressesFromErrorMessages(report) {
  rewriteErrorMessages(report, (errorMessage) => {
    const newErrorMessage = errorMessage.replace(/0x[A-Fa-f0-9]{40}/u, '**');
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
    /** @todo parse and remove/replace URL(s) found in report.message  */
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
  // update request url
  report.request.url = toMetamaskUrl(report.request.url);
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
  const filePath = origUrl.split(globalThis.location.origin)[1];
  if (!filePath) {
    return origUrl;
  }
  const metamaskUrl = `metamask${filePath}`;
  return metamaskUrl;
}
