import * as Sentry from '@sentry/browser';
import { Dedupe, ExtraErrorData, RewriteFrames } from '@sentry/integrations';

import { BuildType } from '../../../shared/constants/app';
import { FilterEvents } from './sentry-filter-events';
import { SimplifyErrorMessages } from './sentry-simplify-error-messages';

/* eslint-disable prefer-destructuring */
// Destructuring breaks the inlining of the environment variables
const METAMASK_DEBUG = process.env.METAMASK_DEBUG;
const METAMASK_ENVIRONMENT = process.env.METAMASK_ENVIRONMENT;
const SENTRY_DSN_DEV = process.env.SENTRY_DSN_DEV;
const METAMASK_BUILD_TYPE = process.env.METAMASK_BUILD_TYPE;
/* eslint-enable prefer-destructuring */

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
    showRestorePrompt: true,
    threeBoxDisabled: true,
    threeBoxLastUpdated: true,
    threeBoxSynced: true,
    threeBoxSyncingAllowed: true,
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
  } else if (METAMASK_DEBUG) {
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

  const originalFilenamePrefix = window.location.origin;
  const normalizedFilenamePrefix = 'metamask';

  Sentry.init({
    dsn: sentryTarget,
    debug: METAMASK_DEBUG,
    environment,
    integrations: [
      new FilterEvents({ getMetaMetricsEnabled }),
      new RewriteFrames({
        iteratee: (frame) => {
          if (
            frame.filename &&
            frame.filename.startsWith(originalFilenamePrefix)
          ) {
            const frameWithoutPrefix = frame.filename.slice(
              originalFilenamePrefix.length,
            );
            frame.filename = `${normalizedFilenamePrefix}${frameWithoutPrefix}`;
          }
          return frame;
        },
      }),
      new SimplifyErrorMessages(),
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
      return breadcrumb;
    },
  });

  function rewriteReport(report) {
    try {
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

  return Sentry;
}

