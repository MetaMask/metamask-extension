import type * as Sentry from '@sentry/browser';
import { MeasurementUnit, Span, StartSpanOptions } from '@sentry/types';
import { createModuleLogger } from '@metamask/utils';
import { sentryLogger } from './sentry';

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
  RevealSeed = 'Reveal Seed',
  ImportSrp = 'Import Srp',
  AddAccount = 'Add Account',
  LoadCollectibles = 'Load Collectibles',
  GetAssetHistoricalPrices = 'Get Asset Historical Prices',
  OnFinishedTransaction = 'On Finished Transaction',
  AccountSyncFull = 'Account Sync Full',
  AccountSyncSaveIndividual = 'Account Sync Save Individual',
  ContactSyncFull = 'Contact Sync Full',
  ContactSyncDeleteRemote = 'Contact Sync Delete Remote',
  ContactSyncUpdateRemote = 'Contact Sync Update Remote',
  ContactSyncSaveBatch = 'Contact Sync Save Batch',
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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

export function trace<ResultType>(
  request: TraceRequest,
  fn: TraceCallback<ResultType>,
): ResultType;

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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

function traceCallback<ResultType>(
  request: TraceRequest,
  fn: TraceCallback<ResultType>,
): ResultType {
  const { name } = request;

  const callback = (span: Sentry.Span | null) => {
    log('Starting trace', name, request);

    const start = Date.now();
    let error: unknown;

    if (span) {
      initSpan(span, request);
    }

    return tryCatchMaybePromise<ResultType>(
      () => fn(span),
      (currentError) => {
        error = currentError;
        throw currentError;
      },
      () => {
        const end = Date.now();
        logTrace(request, start, end, error);
      },
    ) as ResultType;
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
