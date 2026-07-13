import { createModuleLogger } from '@metamask/utils';
import * as Sentry from '@sentry/browser';
import type { Breadcrumb, Event as SentryEvent } from '@sentry/types';
import { logger } from '@sentry/utils';
import { cloneDeep } from 'lodash';
import browser from 'webextension-polyfill';

import { sentryLogger as log } from '../../../shared/lib/sentry';
import { isManifestV3 } from '../../../shared/lib/mv3.utils';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getSentryRelease } from '../../../shared/lib/sentry-release';
import extractEthjsErrorMessage from './extractEthjsErrorMessage';
import { metaMetricsIntegration } from './sentry-metametrics';
import {
  BACKEND_TRACE_PROPAGATION_TARGETS,
  consensysTracePropagationIntegration,
} from './sentry-trace-propagation';
import {
  getAnalyticsState,
  getAnalyticsStateFromAppState,
  getState,
} from './sentry-get-state';
import { makeTransport } from './sentry-make-transport';
import { getInstallType, initInstallType } from './install-type';

const internalLog = createModuleLogger(log, 'internal');

type SentryClientOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;
type BeforeBreadcrumbHandler = NonNullable<SentryClientOptions['beforeBreadcrumb']>;
type RewriteErrorMessage = (errorMessage: string) => string;

type SentrySpanLike = {
  op?: string;
  description?: string;
  name?: string;
};

type SentryStackFrame = {
  filename?: string;
};

type SentryExceptionValue = {
  value?: string;
  stacktrace?: {
    frames?: SentryStackFrame[];
  };
};

type SentryBreadcrumb = Breadcrumb & {
  category?: string;
  data?: Record<string, unknown>;
  message?: string;
};

type SentryReport = Omit<
  SentryEvent,
  'breadcrumbs' | 'contexts' | 'exception' | 'extra' | 'request' | 'spans' | 'tags'
> & {
  breadcrumbs?: SentryBreadcrumb[];
  contexts?: Record<string, unknown>;
  exception?: {
    values?: SentryExceptionValue[];
  };
  extra?: Record<string, unknown>;
  request?: {
    url?: string;
  };
  spans?: SentrySpanLike[];
  tags?: Record<string, string>;
};

/* eslint-disable prefer-destructuring */
// Destructuring breaks the inlining of the environment variables
const METAMASK_BUILD_TYPE: string | undefined = process.env.METAMASK_BUILD_TYPE;
const METAMASK_DEBUG: string | undefined = process.env.METAMASK_DEBUG;
const METAMASK_ENVIRONMENT: string | undefined = process.env.METAMASK_ENVIRONMENT;
const RELEASE = getSentryRelease(
  METAMASK_ENVIRONMENT ?? '',
  process.env.METAMASK_VERSION ?? '',
);
const SENTRY_DSN: string | undefined = process.env.SENTRY_DSN;
const SENTRY_DSN_DEV: string | undefined = process.env.SENTRY_DSN_DEV;
const SENTRY_DSN_PERFORMANCE: string | undefined =
  process.env.SENTRY_DSN_PERFORMANCE;
const SENTRY_DISTRIBUTED_TRACING_ENABLED =
  !process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED;
/* eslint-enable prefer-destructuring */

// This is a fake DSN that can be used to test Sentry without sending data to the real Sentry server.
const SENTRY_DSN_FAKE = 'https://fake@sentry.io/0000000';

export const ERROR_URL_ALLOWLIST: Record<string, string> = {
  CRYPTOCOMPARE: 'cryptocompare.com',
  COINGECKO: 'coingecko.com',
  ETHERSCAN: 'etherscan.io',
  CODEFI: 'codefi.network',
  SEGMENT: 'segment.io',
};

export default function setupSentry(): typeof Sentry | undefined {
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
  setSentryClient();

  return {
    ...Sentry,
  };
}

/**
 * Deep-clone a Sentry report.
 * If `cloneDeep` throws (unexpected graph), returns the original reference.
 *
 * @param report - A Sentry event object: https://develop.sentry.dev/sdk/event-payloads/
 * @returns Cloned report, or original reference on failure.
 */
function safeCloneReport<T>(report: T): T {
  try {
    return cloneDeep(report);
  } catch (err) {
    log('Failed to clone Sentry event, using original reference', err);
    return report;
  }
}

function getClientOptions(): SentryClientOptions {
  const environment = getSentryEnvironment();
  const sentryTarget = getSentryTarget();

  return {
    beforeBreadcrumb: beforeBreadcrumb(),
    // Clone before rewriteReport so we never mutate the event object that dedupeIntegration
    // still holds as previousEvent — rewriteReportUrls changes stack frame filenames in place,
    // which would otherwise make the next error look like a different stack (background timers
    // usually run after beforeSend finished; rapid UI captures often dedupe first).
    beforeSend: (report) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rewriteReport(safeCloneReport(report as SentryReport)) as any,
    beforeSendTransaction: (report) => {
      const transaction = rewriteTransactionReport(
        safeCloneReport(report as SentryReport),
      );
      dropLowValueMarkSpans(transaction);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return transaction as any;
    },
    debug: Boolean(METAMASK_DEBUG),
    dist: isManifestV3 ? 'mv3' : 'mv2',
    dsn: sentryTarget,
    environment,
    integrations: [
      Sentry.dedupeIntegration(),
      Sentry.extraErrorDataIntegration(),
      Sentry.browserTracingIntegration({
        // Creates ui.long-animation-frame spans (falls back to ui.long-task).
        // Pairs with TBT aggregate measurements from performance-observers.ts.
        enableLongAnimationFrame: true,
        shouldCreateSpanForRequest,
      }),
      metaMetricsIntegration({
        getAnalyticsState,
        log,
      }),
      // Must register after `browserTracingIntegration`.
      ...(SENTRY_DISTRIBUTED_TRACING_ENABLED
        ? [consensysTracePropagationIntegration({ log })]
        : []),
    ],
    release: RELEASE,
    // Must be a top-level init option.
    ...(SENTRY_DISTRIBUTED_TRACING_ENABLED && {
      tracePropagationTargets: BACKEND_TRACE_PROPAGATION_TARGETS,
      // TODO(sentry-v10, #42867): Once the v10 upgrade ships, enable
      // `propagateTraceparent: true` here so the SDK attaches `traceparent` to
      // these targets natively. Then remove the manual traceparent injection
      // from `consensysTracePropagationIntegration` (keep the RAPID baggage and
      // the `consensys-request-id` correlation).
    }),
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
 * @param sentryTarget
 * @returns tracesSampleRate to setup Sentry
 */
function getTracesSampleRate(sentryTarget: string | undefined): number {
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
function setCITags(): void {
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

function getSentryEnvironment(): string | undefined {
  if (METAMASK_BUILD_TYPE === 'main') {
    return METAMASK_ENVIRONMENT;
  }

  return `${METAMASK_ENVIRONMENT}-${METAMASK_BUILD_TYPE}`;
}

function getSentryTarget(): string | undefined {
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

function setSentryClient(): true {
  const clientOptions = getClientOptions();
  const { dsn, environment, release, tracesSampleRate } = clientOptions;

  /**
   * Sentry throws on initialization as it wants to avoid polluting the global namespace and
   * potentially clashing with a website also using Sentry, but this could only happen in the content script.
   * This emulates NW.js which disables these validations.
   * https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalWithNw: { nw?: object } = globalThis as any;
  globalWithNw.nw = {};

  /**
   * Sentry checks session tracking support by looking for global history object and functions inside it.
   * Scuttling sets this property to undefined which breaks Sentry logic and crashes background.
   */
  const globalWithHistory: { history?: unknown } = globalThis;
  if (globalWithHistory.history === undefined) {
    globalWithHistory.history = {};
  }

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

/**
 * Receives a string and returns that string if it is a
 * regex match for a url with a `chrome-extension` or `moz-extension`
 * protocol, and an empty string otherwise.
 *
 * @param url - The URL to check.
 * @returns An empty string if the URL was internal, or the unmodified URL otherwise.
 */
function hideUrlIfNotInternal(url: string): string {
  const re = /^(chrome-extension|moz-extension):\/\//u;
  if (!url.match(re)) {
    return '';
  }
  return url;
}

/**
 * Returns a method that handles the Sentry breadcrumb using a specific method to get the extension state
 *
 * @returns A method that modifies a Sentry breadcrumb object
 */
export function beforeBreadcrumb(): BeforeBreadcrumbHandler {
  return (breadcrumb) => {
    if (!getState) {
      return null;
    }
    const appState = getState();
    const state = getAnalyticsStateFromAppState(appState);
    if (
      !state?.completedMetaMetricsOnboarding ||
      !state?.optedIn ||
      breadcrumb?.category === 'ui.input'
    ) {
      return null;
    }
    return breadcrumb;
  };
}

/**
 * Returns whether a span should be created for a given request URL.
 *
 * Filters out high-volume fetches with no per-request diagnostic value:
 * telemetry endpoints (sentry.io, segment.io), static config files re-fetched on
 * a constant poll cadence (chainid.network, acl.execution.metamask.io), and local
 * extension reads (snap manifests / locale files, and content-hashed
 * preinstalled-snap `<hash>.json` bundles). All other requests are traced.
 *
 * @param url - The request URL.
 * @returns Whether to create a span for the request.
 */
export function shouldCreateSpanForRequest(url: string): boolean {
  // Do not create spans for high-volume remote fetches with no per-request
  // diagnostic value: telemetry endpoints (sentry.io, segment.io) and static
  // config files re-fetched on a constant poll cadence (chainid.network chain
  // registry; acl.execution.metamask.io PPOM allowlist registry/signature).
  if (
    /^https?:\/\/(?:[\w\d.@-]+\.)?(?:sentry\.io|segment\.io|chainid\.network|acl\.execution\.metamask\.io)(?:\/|$)/u.test(
      url,
    )
  ) {
    return false;
  }
  // Skip spans for high-volume local extension reads with no diagnostic value:
  // snap manifests and locale files (under `/snaps/` and `/_locales/`, read on
  // every SW restart / popup open) and the content-hashed preinstalled-snap
  // bundles webpack emits at the extension root (`<hash>.json`, see
  // app/scripts/constants/snaps.ts). Other local fetches keep their spans.
  if (
    /^(?:chrome|moz)-extension:\/\/[^/]+\/(?:(?:snaps|_locales)\/|[0-9a-f]{8,}\.json$)/u.test(
      url,
    )
  ) {
    return false;
  }
  // Create spans for all other requests.
  return true;
}

/**
 * Receives a Sentry breadcrumb object and potentially removes urls
 * from its `data` property, in particular those possibly found at
 * data.from, data.to and data.url. Performs a deep address scrub for use when
 * an event is about to be sent (not on every breadcrumb capture).
 *
 * @param breadcrumb - A Sentry breadcrumb object: https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/
 * @returns A modified Sentry breadcrumb object.
 */
export function removeUrlsFromBreadCrumb(
  breadcrumb: SentryBreadcrumb,
): SentryBreadcrumb {
  const { data } = breadcrumb;

  if (typeof data?.url === 'string') {
    data.url = hideUrlIfNotInternal(data.url);
  }
  if (typeof data?.to === 'string') {
    data.to = hideUrlIfNotInternal(data.to);
  }
  if (typeof data?.from === 'string') {
    data.from = hideUrlIfNotInternal(data.from);
  }
  // Sanitize any account addresses that may appear in the breadcrumb message or
  // remaining data values.
  if (typeof breadcrumb.message === 'string') {
    breadcrumb.message = sanitizeAddressesFromString(breadcrumb.message);
  }
  if (data) {
    breadcrumb.data = sanitizeAddressesFromObject(data);
  }
  return breadcrumb;
}

/**
 * Deep-scrubs all breadcrumbs attached to an outbound Sentry event (errors and
 * transactions). The report must already be cloned (see `safeCloneReport` in
 * `beforeSend` / `beforeSendTransaction`) so breadcrumb mutation is safe.
 *
 * @param report - A Sentry event object.
 */
export function sanitizeBreadcrumbsInReport(report: SentryReport): void {
  if (!Array.isArray(report.breadcrumbs)) {
    return;
  }
  for (let i = 0; i < report.breadcrumbs.length; i++) {
    removeUrlsFromBreadCrumb(report.breadcrumbs[i]);
  }
}

// `op: 'mark'` span names with no Sentry-side consumer, dropped from transactions.
const LOW_VALUE_TRACE_MARKS = new Set(['sentry-tracing-init', 'mm-hero-painted']);

/**
 * Removes the {@link LOW_VALUE_TRACE_MARKS} `op: 'mark'` child spans from a
 * transaction event in place. Measures and all other spans are kept.
 *
 * @param report - A Sentry transaction event object.
 */
export function dropLowValueMarkSpans(report: SentryReport): void {
  if (!Array.isArray(report.spans)) {
    return;
  }
  report.spans = report.spans.filter((span) => {
    const markName = span?.description ?? span?.name;
    return !(span?.op === 'mark' && markName && LOW_VALUE_TRACE_MARKS.has(markName));
  });
}

/**
 * Scrubs breadcrumb payloads on performance transaction events before send.
 * {@link rewriteReport} handles errors via `beforeSend`; transactions use
 * `beforeSendTransaction` instead.
 *
 * @param report - A Sentry transaction event object.
 * @returns The modified report (same reference).
 */
export function rewriteTransactionReport(report: SentryReport): SentryReport {
  sanitizeBreadcrumbsInReport(report);
  return report;
}

/**
 * Receives a Sentry event object and modifies it before the error is sent to Sentry.
 * Sanitizes messages/URLs and attaches app state.
 *
 * @param report - A Sentry event object: https://develop.sentry.dev/sdk/event-payloads/
 * @returns The modified report (same reference).
 */
export function rewriteReport(report: SentryReport): SentryReport {
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
    // Deep-scrub breadcrumb payloads only when an error is being sent.
    sanitizeBreadcrumbsInReport(report);
    // Remove addresses from other error parameters (extra, contexts).
    // Done before attaching appState below so the (already masked) appState is
    // not re-walked.
    sanitizeAddressesFromReportData(report);
    // modify report urls
    rewriteReportUrls(report);

    const appState = getState();

    if (!report.extra) {
      report.extra = {};
    }
    if (!report.tags) {
      report.tags = {};
    }

    const installType = getInstallType();

    Object.assign(report.extra, {
      appState,
      installType,
      extensionId: browser.runtime?.id,
    });

    report.tags.installType = installType;
    report.tags.storageKind = String(
      globalThis.stateHooks?.getStorageKind?.() ?? 'unknown',
    );
  } catch (err) {
    log('Error rewriting report', err);
  }
  return report;
}

/**
 * Receives a Sentry event object and modifies it so that urls are removed from any of its
 * error messages.
 *
 * @param report - the report to modify
 */
function sanitizeUrlsFromErrorMessages(report: SentryReport): void {
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
      } catch {
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
function sanitizeAddressesFromErrorMessages(report: SentryReport): void {
  rewriteErrorMessages(report, (errorMessage) =>
    sanitizeAddressesFromString(errorMessage),
  );
}

// Patterns for sanitizing account addresses before sending events to Sentry.
// EVM is handled separately so it can keep its `0x**` replacement form.
const EVM_ADDRESS_REGEX = /0x[A-Fa-f0-9]{40}/gu;
const NON_EVM_ADDRESS_REGEXES = [
  // Tron (base58, starts with `T`, 34 chars total)
  /T[1-9A-HJ-NP-Za-km-z]{33}/gu,
  // Stellar / XLM (starts with `G`, 56 chars total)
  /G[A-Z2-7]{55}/gu,
  // Bitcoin bech32 / taproot (`bc1...`)
  /bc1[02-9ac-hj-np-z]{6,87}/gu,
  // Bitcoin legacy P2PKH / P2SH (base58, starts with `1` or `3`)
  /[13][1-9A-HJ-NP-Za-km-z]{25,34}/gu,
  // Solana (base58, 32-44 chars). Kept last as its range overlaps the others.
  /[1-9A-HJ-NP-Za-km-z]{32,44}/gu,
];

/**
 * Sanitizes EVM and non-EVM account addresses from a string.
 *
 * @param text - The string to sanitize addresses from.
 * @returns The string with any addresses replaced by a mask.
 */
function sanitizeAddressesFromString(text: string): string {
  // Sanitize EVM addresses first so the resulting `0x**` cannot be re-matched by
  // the base58 patterns below.
  let sanitized = text.replace(EVM_ADDRESS_REGEX, '0x**');
  for (const regex of NON_EVM_ADDRESS_REGEXES) {
    sanitized = sanitized.replace(regex, '**');
  }
  return sanitized;
}

/**
 * Recursively sanitizes account addresses from the string values of an object,
 * returning a sanitized copy without mutating the input. Used to scrub addresses
 * that may appear in error parameters such as `report.extra`/`report.contexts`
 * and in breadcrumb data. Not mutating matters for breadcrumbs, whose
 * `data.arguments` holds live references (e.g. the thrown `Error`) that the
 * extension may still use after the event is sent.
 *
 * @param value - The value to sanitize addresses from.
 * @param seen - Maps already-visited inputs to their sanitized copy,
 * so shared references stay consistent and cyclic structures terminate.
 * @returns The sanitized value (a copy for objects/arrays).
 */
function sanitizeAddressesFromObject<T>(
  value: T,
  seen: WeakMap<object, unknown> = new WeakMap(),
): T {
  if (typeof value === 'string') {
    return sanitizeAddressesFromString(value) as T;
  }
  // Leave primitives (and null) untouched.
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const objectValue = value as object;

  // Reuse the sanitized copy for any reference we've already processed, so shared
  // references stay consistent and cyclic structures don't loop forever.
  if (seen.has(objectValue)) {
    return seen.get(objectValue) as T;
  }

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(objectValue, copy);
    for (let i = 0; i < value.length; i++) {
      copy[i] = sanitizeAddressesFromObject(value[i], seen);
    }
    return copy as T;
  }

  const copy: Record<string, unknown> = {};
  seen.set(objectValue, copy);
  // `Error` carries its address-bearing data on `message`/`stack`, which are
  // non-enumerable and so invisible to the `Object.keys` walk below. These show
  // up e.g. in console breadcrumbs, whose `data.arguments` holds the raw thrown
  // error. Copy them across explicitly, sanitized.
  if (value instanceof Error) {
    if (typeof value.message === 'string') {
      copy.message = sanitizeAddressesFromString(value.message);
    }
    if (typeof value.stack === 'string') {
      copy.stack = sanitizeAddressesFromString(value.stack);
    }
    if (typeof value.name === 'string') {
      copy.name = value.name;
    }
  }

  const recordValue = value as Record<string, unknown>;
  for (const key of Object.keys(recordValue)) {
    copy[key] = sanitizeAddressesFromObject(recordValue[key], seen);
  }
  return copy as T;
}

/**
 * Receives a Sentry event object and sanitizes account addresses from its
 * error parameters (`extra` and `contexts`).
 *
 * @param report - the report to modify
 */
function sanitizeAddressesFromReportData(report: SentryReport): void {
  if (report.extra) {
    report.extra = sanitizeAddressesFromObject(report.extra);
  }
  if (report.contexts) {
    report.contexts = sanitizeAddressesFromObject(report.contexts);
  }
}

function simplifyErrorMessages(report: SentryReport): void {
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

function rewriteErrorMessages(
  report: SentryReport,
  rewriteFn: RewriteErrorMessage,
): void {
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

function rewriteReportUrls(report: SentryReport): void {
  if (report.request?.url) {
    // update request url
    report.request.url = toMetamaskUrl(report.request.url);
  }

  // update exception stack trace
  if (report.exception?.values) {
    report.exception.values.forEach((item) => {
      item.stacktrace?.frames?.forEach((frame) => {
        frame.filename = toMetamaskUrl(frame.filename);
      });
    });
  }
}

function toMetamaskUrl(origUrl?: string): string | undefined {
  if (!globalThis.location?.origin) {
    return origUrl;
  }

  const filePath = origUrl?.split(globalThis.location.origin)[1];
  if (!filePath) {
    return origUrl;
  }
  const metamaskUrl = `/metamask${filePath}`;
  return metamaskUrl;
}

function integrateLogging(): void {
  if (!METAMASK_DEBUG) {
    return;
  }

  for (const loggerType of ['log', 'error'] as const) {
    logger[loggerType] = (...args: unknown[]) => {
      const [firstArg, ...rest] = args;
      const message =
        typeof firstArg === 'string'
          ? firstArg.replace(`Sentry Logger [${loggerType}]: `, '')
          : String(firstArg);
      internalLog(message, ...rest);
    };
  }

  log('Integrated logging');
}

function addDebugListeners(): void {
  if (!METAMASK_DEBUG) {
    return;
  }

  const client = Sentry.getClient();

  client?.on('beforeEnvelope', (event: unknown) => {
    if (isCompletedSessionEnvelope(event)) {
      log('Completed session', event);
    }
  });

  client?.on('afterSendEvent', (event: unknown) => {
    const sentryEvent = event as SentryEvent;
    const type = getEventType(sentryEvent);
    log(type, sentryEvent);
  });

  log('Added debug listeners');
}

type SessionEnvelope = [
  unknown,
  Array<[{ type?: string }, { status?: string }]>?,
];

function isCompletedSessionEnvelope(envelope: unknown): boolean {
  const sessionEnvelope = envelope as SessionEnvelope;
  const type = sessionEnvelope?.[1]?.[0]?.[0]?.type;
  const data = sessionEnvelope?.[1]?.[0]?.[1] ?? {};

  return type === 'session' && data.status === 'exited';
}

function getEventType(event: SentryEvent): string {
  if (event.type === 'transaction') {
    return 'Trace';
  }

  if (event.level === 'error') {
    return 'Error';
  }

  return 'Event';
}
