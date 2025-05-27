import * as Sentry from '@sentry/browser';
import { MeasurementUnit, Span, StartSpanOptions } from '@sentry/types';
import { createModuleLogger } from '@metamask/utils';
// TODO: Remove restricted import
import {
  log as sentryLogger,
  getMetaMetricsEnabled,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../app/scripts/lib/setupSentry';

/**
 * The supported trace names.
 */
export enum TraceName {
  AccountList = 'Account List',
  AccountOverviewAssetListTab = 'Account Overview Asset List Tab',
  AccountOverviewNftsTab = 'Account Overview Nfts Tab',
  AccountOverviewActivityTab = 'Account Overview Activity Tab',
  AccountOverviewDeFiTab = 'Account Overview DeFi Tab',
  AssetDetails = 'Asset Details',
  BackgroundConnect = 'Background Connect',
  BridgeBalancesUpdated = 'Bridge Balances Updated',
  BridgeViewLoaded = 'Bridge View Loaded',
  ConnectPage = 'Connect Page',
  CreateAccount = 'Create Account',
  DeveloperTest = 'Developer Test',
  DisconnectAllModal = 'Disconnect All Modal',
  FirstRender = 'First Render',
  GetState = 'Get State',
  ImportNfts = 'Import Nfts',
  ImportTokens = 'Import Tokens',
  InitialActions = 'Initial Actions',
  LazyLoadComponent = 'Lazy Load Component',
  LoadScripts = 'Load Scripts',
  Middleware = 'Middleware',
  NestedTest1 = 'Nested Test 1',
  NestedTest2 = 'Nested Test 2',
  NetworkList = 'Network List',
  NotificationDisplay = 'Notification Display',
  PPOMValidation = 'PPOM Validation',
  ReceiveModal = 'Receive Modal',
  SendCompleted = 'Send Completed',
  SetupStore = 'Setup Store',
  Signature = 'Signature',
  SwapQuotesFetched = 'Swap Quotes Fetched',
  SwapViewLoaded = 'Swap View Loaded',
  Transaction = 'Transaction',
  UIStartup = 'UI Startup',
  OnboardingNewSocialAccountExists = 'Onboarding - New Social Account Exists',
  OnboardingNewSocialCreateWallet = 'Onboarding - New Social Create Wallet',
  OnboardingNewSrpCreateWallet = 'Onboarding - New SRP Create Wallet',
  OnboardingExistingSocialLogin = 'Onboarding - Existing Social Login',
  OnboardingExistingSocialAccountNotFound = 'Onboarding - Existing Social Account Not Found',
  OnboardingExistingSrpImport = 'Onboarding - Existing SRP Import',
  OnboardingJourneyOverall = 'Onboarding - Overall Journey',
  OnboardingSocialLoginAttempt = 'Onboarding - Social Login Attempt',
  OnboardingPasswordSetupAttempt = 'Onboarding - Password Setup Attempt',
  OnboardingPasswordLoginAttempt = 'Onboarding - Password Login Attempt',
  OnboardingResetPassword = 'Onboarding - Reset Password',
  OnboardingCreateKeyAndBackupSrp = 'Onboarding - Create Key and Backup SRP',
  OnboardingAddSrp = 'Onboarding - Add SRP',
  OnboardingFetchSrps = 'Onboarding - Fetch SRPs',
  OnboardingOAuthProviderLogin = 'Onboarding - OAuth Provider Login',
  OnboardingOAuthBYOAServerGetAuthTokens = 'Onboarding - OAuth BYOA Server Get Auth Tokens',
  OnboardingOAuthSeedlessAuthenticate = 'Onboarding - OAuth Seedless Authenticate',
  OnboardingSocialLoginError = 'Onboarding - Social Login Error',
  OnboardingPasswordSetupError = 'Onboarding - Password Setup Error',
  OnboardingPasswordLoginError = 'Onboarding - Password Login Error',
  OnboardingResetPasswordError = 'Onboarding - Reset Password Error',
  OnboardingCreateKeyAndBackupSrpError = 'Onboarding - Create Key and Backup SRP Error',
  OnboardingAddSrpError = 'Onboarding - Add SRP Error',
  OnboardingFetchSrpsError = 'Onboarding - Fetch SRPs Error',
  OnboardingOAuthProviderLoginError = 'Onboarding - OAuth Provider Login Error',
  OnboardingOAuthBYOAServerGetAuthTokensError = 'Onboarding - OAuth BYOA Server Get Auth Tokens Error',
  OnboardingOAuthSeedlessAuthenticateError = 'Onboarding - OAuth Seedless Authenticate Error',
}

/**
 * The operation names to use for the trace.
 */
export enum TraceOperation {
  OnboardingUserJourney = 'onboarding.user_journey',
  OnboardingSecurityOp = 'onboarding.security_operation',
  OnboardingError = 'onboarding.error',
}

const log = createModuleLogger(sentryLogger, 'trace');

const ID_DEFAULT = 'default';
const OP_DEFAULT = 'custom';

const tracesByKey: Map<string, PendingTrace> = new Map();
const durationsByName: { [name: string]: number } = {};

let consentCache: boolean | null = null;
const preConsentCallBuffer: PreConsentCallBuffer[] = [];

if (process.env.IN_TEST && globalThis.stateHooks) {
  globalThis.stateHooks.getCustomTraces = () => durationsByName;
}

type PendingTrace = {
  end: (timestamp?: number) => void;
  request: TraceRequest;
  startTime: number;
  span?: Span | null;
};

/**
 * A context object to associate traces with each other and generate nested traces.
 */
export type TraceContext = unknown;

/**
 * A callback function that can be traced.
 */
export type TraceCallback<T> = (context?: TraceContext) => T;

/**
 * A request to create a new trace.
 */
export type TraceRequest = {
  /**
   * Custom data to associate with the trace.
   */
  data?: Record<string, number | string | boolean>;

  /**
   * A unique identifier when not tracing a callback.
   * Defaults to 'default' if not provided.
   */
  id?: string;

  /**
   * The name of the trace.
   */
  name: TraceName;

  /**
   * The parent context of the trace.
   * If provided, the trace will be nested under the parent trace.
   */
  parentContext?: TraceContext;

  /**
   * Override the start time of the trace.
   */
  startTime?: number;

  /**
   * Custom tags to associate with the trace.
   */
  tags?: Record<string, number | string | boolean>;

  /**
   * Custom operation name to associate with the trace.
   */
  op?: string;
};

/**
 * A request to end a pending trace.
 */
export type EndTraceRequest = {
  /**
   * The unique identifier of the trace.
   * Defaults to 'default' if not provided.
   */
  id?: string;

  /**
   * The name of the trace.
   */
  name: TraceName;

  /**
   * Override the end time of the trace.
   */
  timestamp?: number;

  /**
   * Custom data to associate with the trace when ending it.
   * These will be set as attributes on the span.
   */
  data?: Record<string, number | string | boolean>;
};

type PreConsentCallBuffer<T = TraceRequest | EndTraceRequest> = {
  type: 'start' | 'end';
  request: T;
  parentTraceName?: string; // Track parent trace name for reconnecting during flush
};

type SentrySpanWithName = Span & {
  _name?: string;
};

export function trace<T>(request: TraceRequest, fn: TraceCallback<T>): T;

export function trace(request: TraceRequest): TraceContext;

/**
 * Create a Sentry transaction to analyse the duration of a code flow.
 * If a callback is provided, the transaction will be automatically ended when the callback completes.
 * If the callback returns a promise, the transaction will be ended when the promise resolves or rejects.
 * If no callback is provided, the transaction must be manually ended using `endTrace`.
 *
 * @param request - The data associated with the trace, such as the name and tags.
 * @param fn - The optional callback to record the duration of.
 * @returns The context of the trace, or the result of the callback if provided.
 */
export function trace<T>(
  request: TraceRequest,
  fn?: TraceCallback<T>,
): T | TraceContext {
  if (!fn) {
    return startTrace(request);
  }

  return traceCallback(request, fn);
}

/**
 * End a pending trace that was started without a callback.
 * Does nothing if the pending trace cannot be found.
 *
 * @param request - The data necessary to identify and end the pending trace.
 */
export function endTrace(request: EndTraceRequest): void {
  const { name, timestamp } = request;
  const id = getTraceId(request);
  const key = getTraceKey(request);
  const pendingTrace = tracesByKey.get(key);

  if (!pendingTrace) {
    log('No pending trace found', name, id);
    return;
  }

  if (request.data && pendingTrace.span) {
    const span = pendingTrace.span as Span;
    for (const [attrKey, attrValue] of Object.entries(request.data)) {
      span.setAttribute(attrKey, attrValue);
    }
  }

  pendingTrace.end(timestamp);

  tracesByKey.delete(key);

  const { request: pendingRequest, startTime } = pendingTrace;
  const endTime = timestamp ?? getPerformanceTimestamp();

  logTrace(pendingRequest, startTime, endTime);
}

/**
 * Buffered version of trace. Handles consent and buffering logic before calling trace.
 *
 * @param request - The data associated with the trace, such as the name and tags.
 * @param fn - The optional callback to record the duration of.
 * @returns The context of the trace, or the result of the callback if provided.
 */
export function bufferedTrace<T>(
  request: TraceRequest,
  fn?: TraceCallback<T>,
): T | TraceContext {
  // If consent is not cached or not given, buffer the trace start
  if (consentCache !== true) {
    if (consentCache === null) {
      updateIsConsentGivenForSentry();
    }
    // Extract parent trace name if parentContext exists
    let parentTraceName: string | undefined;
    if (request.parentContext && typeof request.parentContext === 'object') {
      const parentSpan = request.parentContext as SentrySpanWithName;
      parentTraceName = parentSpan._name;
    }
    preConsentCallBuffer.push({
      type: 'start',
      request: {
        ...request,
        parentContext: undefined, // Remove original parentContext to avoid invalid references
        // Use `Date.now()` as `performance.timeOrigin` is only valid for measuring durations within
        // the same session; it won't produce valid event times for Sentry if buffered and flushed later
        startTime: request.startTime ?? Date.now(),
      },
      parentTraceName, // Store the parent trace name for later reconnection
    });
  }
  if (fn) {
    return trace(request, fn);
  }
  return trace(request);
}

/**
 * Buffered version of endTrace. Handles consent and buffering logic before calling endTrace.
 *
 * @param request - The data associated with the trace, such as the name and tags.
 */
export function bufferedEndTrace(request: EndTraceRequest): void {
  // If consent is not cached or not given, buffer the trace end
  if (consentCache !== true) {
    if (consentCache === null) {
      updateIsConsentGivenForSentry();
    }
    preConsentCallBuffer.push({
      type: 'end',
      request: {
        ...request,
        // Use `Date.now()` as `performance.timeOrigin` is only valid for measuring durations within
        // the same session; it won't produce valid event times for Sentry if buffered and flushed later
        timestamp: request.timestamp ?? Date.now(),
      },
    });
  }
  endTrace(request);
}

/**
 * Flushes buffered traces to Sentry if consent is currently granted.
 * If consent is not granted, the buffer is cleared.
 */
export async function flushBufferedTraces(): Promise<void> {
  const canFlush = await updateIsConsentGivenForSentry();
  if (!canFlush) {
    log('Consent not given, cannot flush buffered traces.');
    preConsentCallBuffer.length = 0;
    return;
  }

  log('Flushing buffered traces. Count:', preConsentCallBuffer.length);
  const bufferToProcess = [...preConsentCallBuffer];
  preConsentCallBuffer.length = 0;

  const activeSpans = new Map<string, Span>();

  for (const call of bufferToProcess) {
    if (call.type === 'start') {
      const traceName = call.request.name as string;

      // Get parent if applicable
      let parentSpan: Span | undefined;
      if (call.parentTraceName) {
        parentSpan = activeSpans.get(call.parentTraceName);
      }

      const span = trace({
        ...call.request,
        parentContext: parentSpan,
      }) as unknown as Span;

      if (span) {
        activeSpans.set(traceName, span);
      }
    } else if (call.type === 'end') {
      endTrace(call.request);
      activeSpans.delete(call.request.name as string);
    }
  }
  log('Finished flushing buffered traces');
}

/**
 * Discards all traces currently in the pre-consent buffer.
 */
export function discardBufferedTraces(): void {
  preConsentCallBuffer.length = 0;
}

function traceCallback<T>(request: TraceRequest, fn: TraceCallback<T>): T {
  const { name } = request;

  const callback = (span: Sentry.Span | null) => {
    log('Starting trace', name, request);

    const start = Date.now();
    let error: unknown;

    if (span) {
      initSpan(span, request);
    }

    return tryCatchMaybePromise<T>(
      () => fn(span),
      (currentError) => {
        error = currentError;
        throw currentError;
      },
      () => {
        const end = Date.now();
        logTrace(request, start, end, error);
      },
    ) as T;
  };

  return startSpan(request, (spanOptions) =>
    sentryStartSpan(spanOptions, callback),
  );
}

function startTrace(request: TraceRequest): TraceContext {
  const { name, startTime: requestStartTime } = request;
  const startTime = requestStartTime ?? getPerformanceTimestamp();
  const id = getTraceId(request);

  const callback = (span: Sentry.Span | null) => {
    const end = (timestamp?: number) => {
      span?.end(timestamp);
    };

    if (span) {
      initSpan(span, request);
    }

    const pendingTrace = { end, request, startTime, span };
    const key = getTraceKey(request);
    tracesByKey.set(key, pendingTrace);

    log('Started trace', name, id, request);

    return span;
  };

  return startSpan(request, (spanOptions) =>
    sentryStartSpanManual(spanOptions, callback),
  );
}

function startSpan<T>(
  request: TraceRequest,
  callback: (spanOptions: StartSpanOptions) => T,
) {
  const { data: attributes, name, parentContext, startTime, op } = request;
  const parentSpan = (parentContext ?? null) as Sentry.Span | null;

  const spanOptions: StartSpanOptions = {
    attributes,
    name,
    op: op ?? OP_DEFAULT,
    parentSpan,
    startTime,
  };

  return sentryWithIsolationScope((scope: Sentry.Scope) => {
    initScope(scope, request);
    return callback(spanOptions);
  });
}

function logTrace(
  request: TraceRequest,
  startTime: number,
  endTime: number,
  error?: unknown,
) {
  const duration = endTime - startTime;
  const { name } = request;

  if (process.env.IN_TEST) {
    durationsByName[name] = duration;
  }

  log('Finished trace', name, duration, { request, error });
}

function getTraceId(request: TraceRequest | EndTraceRequest) {
  return request.id ?? ID_DEFAULT;
}

function getTraceKey(request: TraceRequest | EndTraceRequest) {
  const { name } = request;
  const id = getTraceId(request);

  return [name, id].join(':');
}

function getPerformanceTimestamp(): number {
  return performance.timeOrigin + performance.now();
}

/**
 * Initialise the isolated Sentry scope created for each trace.
 * Includes setting all non-numeric tags.
 *
 * @param scope - The Sentry scope to initialise.
 * @param request - The trace request.
 */
function initScope(scope: Sentry.Scope, request: TraceRequest) {
  const tags = request.tags ?? {};

  for (const [key, value] of Object.entries(tags)) {
    if (typeof value !== 'number') {
      scope.setTag(key, value);
    }
  }
}

/**
 * Initialise the Sentry span created for each trace.
 * Includes setting all numeric tags as measurements so they can be queried numerically in Sentry.
 *
 * @param _span - The Sentry span to initialise.
 * @param request - The trace request.
 */
function initSpan(_span: Sentry.Span, request: TraceRequest) {
  const tags = request.tags ?? {};

  for (const [key, value] of Object.entries(tags)) {
    if (typeof value === 'number') {
      sentrySetMeasurement(key, value, 'none');
    }
  }
}

function tryCatchMaybePromise<T>(
  tryFn: () => T,
  catchFn: (error: unknown) => void,
  finallyFn: () => void,
): T | undefined {
  let isPromise = false;

  try {
    const result = tryFn() as T;

    if (result instanceof Promise) {
      isPromise = true;
      return result.catch(catchFn).finally(finallyFn) as T;
    }

    return result;
  } catch (error) {
    if (!isPromise) {
      catchFn(error);
    }
  } finally {
    if (!isPromise) {
      finallyFn();
    }
  }

  return undefined;
}

function sentryStartSpan<T>(
  spanOptions: StartSpanOptions,
  callback: (span: Sentry.Span | null) => T,
): T {
  const actual = globalThis.sentry?.startSpan;

  if (!actual) {
    return callback(null);
  }

  return actual(spanOptions, callback);
}

function sentryStartSpanManual<T>(
  spanOptions: StartSpanOptions,
  callback: (span: Sentry.Span | null) => T,
): T {
  const actual = globalThis.sentry?.startSpanManual;

  if (!actual) {
    return callback(null);
  }

  return actual(spanOptions, callback);
}

function sentryWithIsolationScope<T>(callback: (scope: Sentry.Scope) => T): T {
  const actual = globalThis.sentry?.withIsolationScope;

  if (!actual) {
    const scope = {
      // eslint-disable-next-line no-empty-function
      setTag: () => {},
    } as unknown as Sentry.Scope;

    return callback(scope);
  }

  return actual(callback);
}

function sentrySetMeasurement(
  key: string,
  value: number,
  unit: MeasurementUnit,
) {
  const actual = globalThis.sentry?.setMeasurement;

  if (!actual) {
    return;
  }

  actual(key, value, unit);
}

/**
 * Updates the consentCache by calling getMetaMetricsEnabled.
 */
async function updateIsConsentGivenForSentry(): Promise<boolean> {
  consentCache = await getMetaMetricsEnabled();
  return consentCache;
}
