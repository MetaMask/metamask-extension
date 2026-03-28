import { createModuleLogger } from '@metamask/utils';
import * as Sentry from '@sentry/react';
import { sentryLogger as log } from '../sentry';
import { isManifestV3 } from '../mv3.utils';
import { getManifestFlags } from '../manifestFlags';
import { getSentryRelease } from '../sentry-release';
import { filterEvents } from './sentry-filter-events';
import { initInstallType } from './install-type';

const internalLog = createModuleLogger(log, 'internal');

/* eslint-disable prefer-destructuring */
// Destructuring breaks the inlining of the environment variables
const METAMASK_BUILD_TYPE = process.env.METAMASK_BUILD_TYPE;
const METAMASK_DEBUG = process.env.METAMASK_DEBUG;
const METAMASK_ENVIRONMENT = process.env.METAMASK_ENVIRONMENT;
const RELEASE = getSentryRelease(
  METAMASK_ENVIRONMENT,
  process.env.METAMASK_VERSION,
);
const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_DSN_DEV = process.env.SENTRY_DSN_DEV;
const SENTRY_DSN_PERFORMANCE = process.env.SENTRY_DSN_PERFORMANCE;
/* eslint-enable prefer-destructuring */

// This is a fake DSN that can be used to test Sentry without sending data to the real Sentry server.
const SENTRY_DSN_FAKE = 'https://fake@sentry.io/0000000';

export const ERROR_URL_ALLOWLIST = {
  CRYPTOCOMPARE: 'cryptocompare.com',
  COINGECKO: 'coingecko.com',
  ETHERSCAN: 'etherscan.io',
  CODEFI: 'codefi.network',
  SEGMENT: 'segment.io',
};

/**
 * Initializes Sentry for error reporting and performance tracing.
 *
 * @param {import('@sentry/types').Integration[]} [extraIntegrations] - Optional additional integrations to include.
 * @returns {object | undefined} The Sentry object if initialized, or undefined otherwise.
 */
export default function setupSentry(extraIntegrations = []) {
  if (!RELEASE) {
    throw new Error('Missing release');
  }

  if (!getSentryTarget()) {
    log('Skipped initialization');
    return undefined;
  }

  log('Initializing');

  // Initialize install type early - fire and forget.
  // By the time errors are reported, the cache should be populated.
  initInstallType();

  integrateLogging();
  setSentryClient(extraIntegrations);

  return {
    ...Sentry,
    getMetaMetricsEnabled,
  };
}

function getClientOptions(extraIntegrations = []) {
  const environment = getSentryEnvironment();
  const sentryTarget = getSentryTarget();

  const hasTracingIntegration = extraIntegrations.some(
    (integration) =>
      integration.name.includes('Tracing') ||
      integration.name.includes('Routing'),
  );

  const integrations = [
    Sentry.dedupeIntegration(),
    Sentry.extraErrorDataIntegration(),
    filterEvents({ getMetaMetricsEnabled, log }),
    ...extraIntegrations,
  ];

  if (!hasTracingIntegration) {
    integrations.push(
      Sentry.browserTracingIntegration({
        shouldCreateSpanForRequest: (url) => {
          // Do not create spans for outgoing requests to a 'sentry.io' domain.
          return !url.match(/^https?:\/\/([\w\d.@-]+\.)?sentry\.io(\/|$)/u);
        },
      }),
    );
  }

  return {
    beforeBreadcrumb: beforeBreadcrumb(),
    beforeSend: (report) => rewriteReport(report),
    debug: METAMASK_DEBUG,
    dist: isManifestV3 ? 'mv3' : 'mv2',
    dsn: sentryTarget,
    environment,
    integrations,
    release: RELEASE,
    // Client reports are automatically sent when a page's visibility changes to
    // "hidden", but cancelled (with an Error) that gets logged to the console.
    // Our test infra sometimes reports these errors as unexpected failures,
    // which results in test flakiness. We don't use these client reports, so
    // we can safely turn them off by setting the `sendClientReports` option to
    // `false`.
    sendClientReports: false,
    tracesSampleRate: getTracesSampleRate(sentryTarget),
    // If we are reporting to SENTRY_DSN_PERFORMANCE, we want to ignore all errors.
    ignoreErrors: sentryTarget === SENTRY_DSN_PERFORMANCE ? [/.*/u] : undefined,
    transport: makeTransport,
  };
}

/**
 * Compute the tracesSampleRate depending on testing condition.
 *
 * @param {string} sentryTarget
 * @returns tracesSampleRate to setup Sentry
 */
function getTracesSampleRate(sentryTarget) {
  if (sentryTarget === SENTRY_DSN_FAKE) {
    return 1.0;
  }

  const flags = getManifestFlags();

  // Grab the tracesSampleRate that may have come in from a git message
  // 0 is a valid value, so must explicitly check for undefined
  if (flags.sentry?.tracesSampleRate !== undefined) {
    return flags.sentry.tracesSampleRate;
  }

  if (flags.ci) {
    // Report more frequently on main branch, and less frequently on other branches
    // (Unless you use a `flags = {"sentry": {"tracesSampleRate": x.xx}}` override)
    if (flags.ci.branch === 'main') {
      return 0.015;
    }
    return 0.001;
  }

  if (METAMASK_DEBUG) {
    return 1.0;
  }

  return 0.0075;
}

/**
 * Get CI tags passed from the test environment, through manifest.json,
 * and give them to the Sentry client.
 */
function setCITags() {
  const { ci } = getManifestFlags();

  if (ci?.enabled) {
    Sentry.setTag('ci.enabled', ci.enabled);
    Sentry.setTag('ci.branch', ci.branch);
    Sentry.setTag('ci.commitHash', ci.commitHash);
    Sentry.setTag('ci.job', ci.job);
    Sentry.setTag('ci.matrixIndex', ci.matrixIndex);
    Sentry.setTag('ci.prNumber', ci.prNumber);
    if (ci.persona) {
      Sentry.setTag('ci.persona', ci.persona);
    }
    if (ci.testTitle) {
      Sentry.setTag('ci.testTitle', ci.testTitle);
    }
  }
}

/**
 * Returns whether MetaMetrics is enabled, given the application state.
 *
 * @param {{ state: unknown} | { persistedState: unknown }} appState - Application state
 * @returns `true` if MetaMask's state has been initialized, and MetaMetrics
 * is enabled, `false` otherwise.
 */
function getMetaMetricsEnabledFromAppState(appState) {
  // during initialization after loading persisted state
  if (appState.persistedState) {
    return getMetaMetricsEnabledFromPersistedState(appState.persistedState);
    // After initialization
  } else if (appState.state) {
    // UI
    if (appState.state.metamask) {
      return Boolean(appState.state.metamask.participateInMetaMetrics);
    }
    // background
    return Boolean(
      appState.state.MetaMetricsController?.participateInMetaMetrics,
    );
  }
  // during initialization, before first persisted state is read
  return false;
}

/**
 * Returns whether MetaMetrics is enabled, given the persisted state.
 *
 * @param {unknown} persistedState - Application state
 * @returns `true` if MetaMask's state has been initialized, and MetaMetrics
 * is enabled, `false` otherwise.
 */
function getMetaMetricsEnabledFromPersistedState(persistedState) {
  return Boolean(
    persistedState?.data?.MetaMetricsController?.participateInMetaMetrics,
  );
}

/**
 * Returns whether MetaMetrics is enabled, given the backup state.
 *
 * @param {unknown} backupState - Backup state from IndexedDB
 * @returns `true` if MetaMetrics is enabled in the backup, `false` otherwise.
 */
function getMetaMetricsEnabledFromBackupState(backupState) {
  return Boolean(backupState?.MetaMetricsController?.participateInMetaMetrics);
}

function getSentryEnvironment() {
  if (METAMASK_BUILD_TYPE === 'main') {
    return METAMASK_ENVIRONMENT;
  }

  return `${METAMASK_ENVIRONMENT}-${METAMASK_BUILD_TYPE}`;
}

function getSentryTarget() {
  const manifestFlags = getManifestFlags();

  if (
    process.env.IN_TEST &&
    (!SENTRY_DSN_DEV || !manifestFlags.sentry?.forceEnable)
  ) {
    return SENTRY_DSN_FAKE;
  }

  if (manifestFlags.ci?.enabled && SENTRY_DSN_PERFORMANCE) {
    return SENTRY_DSN_PERFORMANCE;
  }

  if (METAMASK_ENVIRONMENT !== 'production') {
    return SENTRY_DSN_DEV;
  }

  if (!SENTRY_DSN) {
    throw new Error(
      `Missing SENTRY_DSN environment variable in production environment`,
    );
  }

  return SENTRY_DSN;
}

/**
 * Returns whether MetaMetrics is enabled. If the application hasn't yet
 * been initialized, the persisted state will be used (if any).
 *
 * @returns `true` if MetaMetrics is enabled, `false` otherwise.
 */
async function getMetaMetricsEnabled() {
  const flags = getManifestFlags();

  if (flags.ci && flags.sentry.forceEnable) {
    return true;
  }

  const appState = getState();

  if (appState.state || appState.persistedState) {
    return getMetaMetricsEnabledFromAppState(appState);
  }

  // If we reach here, it means the error was thrown before initialization
  // completed, and before we loaded the persisted state for the first time.
  try {
    const persistedState = await globalThis.stateHooks.getPersistedState();
    return getMetaMetricsEnabledFromPersistedState(persistedState);
  } catch (error) {
    log('Error retrieving persisted state, falling back to backup', error);
    // Primary storage failed (e.g., database corruption) - check the backup
    try {
      const backupState = await globalThis.stateHooks.getBackupState();
      return getMetaMetricsEnabledFromBackupState(backupState);
    } catch (backupError) {
      log('Error retrieving backup state', backupError);
      return false;
    }
  }
}

function setSentryClient(extraIntegrations = []) {
  const clientOptions = getClientOptions(extraIntegrations);
  const { dsn, environment, release, tracesSampleRate } = clientOptions;

  /**
   * Sentry throws on initialization as it wants to avoid polluting the global namespace and
   * potentially clashing with a website also using Sentry, but this could only happen in the content script.
   * This emulates NW.js which disables these validations.
   * https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
   */
  globalThis.nw = {};

  /**
   * Sentry checks session tracking support by looking for global history object and functions inside it.
   * Scuttling sets this property to undefined which breaks Sentry logic and crashes background.
   */
  globalThis.history ??= {};

  log('Updating client', {
    environment,
    dsn,
    release,
    tracesSampleRate,
  });

  Sentry.registerSpanErrorInstrumentation();
  Sentry.init(clientOptions);

  setCITags();

  addDebugListeners();

  return true;
}

function rewriteReport(report) {
  try {
    if (report.message) {
      report.message = removeUrlsFromMessage(report.message);
    }
    if (report.exception && report.exception.values) {
      report.exception.values.forEach((exception) => {
        if (exception.value) {
          exception.value = removeUrlsFromMessage(exception.value);
        }
      });
    }
    if (report.breadcrumbs) {
      report.breadcrumbs.forEach((breadcrumb) => {
        removeUrlsFromBreadCrumb(breadcrumb);
      });
    }
    if (report.request && report.request.url) {
      report.request.url = removeUrlsFromMessage(report.request.url);
    }
  } catch (err) {
    internalLog('Error rewriting report', err);
  }
  return report;
}

function removeUrlsFromMessage(message) {
  // eslint-disable-next-line no-useless-escape
  return message.replace(/https?:\/\/[^\s]+/gu, '[URL]');
}

export function removeUrlsFromBreadCrumb(breadcrumb) {
  if (breadcrumb.data && typeof breadcrumb.data === 'object') {
    if (breadcrumb.data.url) {
      breadcrumb.data.url = removeUrlsFromMessage(breadcrumb.data.url);
    }
    if (breadcrumb.data.from) {
      breadcrumb.data.from = removeUrlsFromMessage(breadcrumb.data.from);
    }
    if (breadcrumb.data.to) {
      breadcrumb.data.to = removeUrlsFromMessage(breadcrumb.data.to);
    }
  }
  return breadcrumb;
}

function integrateLogging() {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    Sentry.withScope((scope) => {
      scope.setExtra('arguments', args);
      Sentry.captureMessage('console.error', 'error');
    });
    originalConsoleError.apply(console, args);
  };
}

function makeTransport(options) {
  return Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport)(options);
}

function getState() {
  if (globalThis.stateHooks?.getAppState) {
    return { state: globalThis.stateHooks.getAppState() };
  }
  return {};
}

function beforeBreadcrumb() {
  return (breadcrumb) => {
    if (breadcrumb.category === 'fetch') {
      const { url } = breadcrumb.data;
      if (
        url &&
        Object.values(ERROR_URL_ALLOWLIST).some((u) => url.includes(u))
      ) {
        return breadcrumb;
      }
      return null;
    }
    return breadcrumb;
  };
}

function addDebugListeners() {
  if (METAMASK_DEBUG) {
    Sentry.addEventProcessor((event) => {
      internalLog('Sentry event', event);
      return event;
    });
  }
}
