import type * as Sentry from '@sentry/browser';
import type {
  MeasurementUnit,
  Span,
  StartSpanOptions,
  TraceparentData,
} from '@sentry/types';
import { createModuleLogger, hasProperty, isObject } from '@metamask/utils';
import type {
  TraceCallback as ControllerTraceCallback,
  TraceRequest as ControllerTraceRequest,
  TraceContext as ControllerTraceContext,
} from '@metamask/controller-utils';
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
  AccountOverviewPerpsTab = 'Account Overview Perps Tab',
  AssetDetails = 'Asset Details',
  BackgroundConnect = 'Background Connect',
  BridgeBalancesUpdated = 'Bridge Balances Updated',
  BridgeViewLoaded = 'Bridge View Loaded',
  ConnectPage = 'Connect Page',
  CreateAccount = 'Create Account',
  DeveloperTest = 'Developer Test',
  DisconnectAllModal = 'Disconnect All Modal',
  FirstRender = 'First Render',
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
  OnboardingResetPasswordError = 'Onboarding - Reset Password Error',
  OnboardingCreateKeyAndBackupSrpError = 'Onboarding - Create Key and Backup SRP Error',
  OnboardingAddSrpError = 'Onboarding - Add SRP Error',
  OnboardingFetchSrpsError = 'Onboarding - Fetch SRPs Error',
  OnboardingOAuthProviderLoginError = 'Onboarding - OAuth Provider Login Error',
  OnboardingOAuthBYOAServerGetAuthTokensError = 'Onboarding - OAuth BYOA Server Get Auth Tokens Error',
  OnboardingOAuthSeedlessAuthenticateError = 'Onboarding - OAuth Seedless Authenticate Error',
  // Accounts
  ShowAccountList = 'Show Account List',
  ShowAccountAddressList = 'Show Account Address List',
  ShowAccountPrivateKeyList = 'Show Account Private Key List',
  CreateMultichainAccount = 'Create Multichain Account',
  DiscoverAccounts = 'Discover Accounts',
  EvmDiscoverAccounts = 'EVM Discover Accounts',
  // mUSD / 1-Click Convert
  MusdConversionNavigation = 'mUSD Conversion Navigation',
  MusdConversionQuote = 'mUSD Conversion Quote',
  MusdConversionConfirm = 'mUSD Conversion Confirm',
  BatchSellModal = 'Batch Sell Modal',
}

/**
 * The operation names to use for the trace.
 */
export enum TraceOperation {
  AccountList = 'account.list',
  OnboardingUserJourney = 'onboarding.user_journey',
  OnboardingSecurityOp = 'onboarding.security_operation',
  OnboardingError = 'onboarding.error',
  // Accounts
  AccountCreate = 'account.create',
  AccountUi = 'account.ui',
  AccountDiscover = 'account.discover',
  // mUSD Conversion
  MusdConversionOperation = 'musd.conversion.operation',
  MusdConversionDataFetch = 'musd.conversion.data_fetch',
}

const log = createModuleLogger(sentryLogger, 'trace');

const ID_DEFAULT = 'default';
const OP_DEFAULT = 'custom';

/**
 * Current W3C `traceparent` version byte. Both producer and consumer ship in
 * lockstep within the extension binary, so we always emit version `00`.
 */
const W3C_TRACEPARENT_VERSION = '00';

/**
 * W3C `trace-flags` sampled bit (bit 0). When set, the trace is recorded.
 */
const TRACE_FLAG_SAMPLED = 0x1;

/**
 * Matches a W3C `traceparent` string:
 * `{version}-{traceId}-{parentId}-{flags}` with lowercase-hex fields of the
 * canonical lengths (2 / 32 / 16 / 2). Capture groups: traceId, parentId, flags.
 */
const W3C_TRACEPARENT_REGEXP =
  /^[0-9a-f]{2}-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/u;

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
 * Serialized trace context for cross-boundary propagation.
 * Carries a W3C `traceparent` string for distributed tracing and optional
 * name/id for same-process parent lookup via the tracesByKey map.
 */
export type SerializedTraceContext = {
  _name?: string;
  _id?: string;
  traceparent?: string;
};

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
   * The name of the trace. Accepts a `TraceName` enum value
   * or the name of a RPC method or messenger action.
   */
  name: TraceName | `${'Background RPC' | 'Messenger Call'}: ${string}`;

  /**
   * The parent context of the trace.
   * If provided, the trace will be nested under the parent trace.
   * Can be either:
   * - A Sentry Span
   * - { _name: TraceName, _id?: string } (when serialized across RPC)
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
 * Adapter that wraps the extension's synchronous {@link trace} function into the
 * async {@link ControllerTraceCallback} signature expected by `@metamask/assets-controller`.
 * @param req - The trace request.
 * @param fn - The trace callback.
 * @returns The result of the trace.
 */
export const traceAsControllerCallback: ControllerTraceCallback = <Result>(
  req: ControllerTraceRequest,
  fn?: (ctx?: ControllerTraceContext) => Result,
): Promise<Result> =>
  Promise.resolve(
    fn
      ? trace({ ...req, name: req.name as TraceName }, fn)
      : trace({ ...req, name: req.name as TraceName }),
  ) as Promise<Result>;

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
 * Get the serialized trace context from the currently active Sentry span.
 * Used by cross-boundary wrappers to propagate trace context over RPC.
 * Always propagates when an active span exists, so background-side spans
 * (auto-instrumented `http.client`, core-package `trace()` callers, etc.)
 * are correctly nested under the originating UI trace regardless of whether
 * wrapper spans themselves are sub-sampled in.
 *
 * @returns A W3C `traceparent` string, or undefined if no active span or kill switch is set.
 */
export function getSerializedTraceContext(): string | undefined {
  if (process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED) {
    return undefined;
  }
  const activeSpan = sentryGetActiveSpan();
  if (!activeSpan) {
    return undefined;
  }
  try {
    return spanContextToTraceparent(activeSpan.spanContext());
  } catch {
    return undefined;
  }
}

/**
 * Extract trace context appended by submitRequestToBackground from RPC params.
 * Returns the clean params (without trace context) and the parsed trace context
 * if present. Only strips when the last param has `_traceContext` holding a
 * valid W3C `traceparent` string, to avoid eating legitimate params.
 *
 * @param params - RPC call parameters.
 * @returns Clean params (without the trace wrapper) and the parsed
 * {@link TraceparentData} if present, or `undefined` if no valid trace context
 * was found.
 */
export function extractTraceContext(
  params: unknown,
):
  | { cleanParams: unknown[]; traceContext: TraceparentData }
  | { cleanParams: unknown; traceContext: undefined } {
  if (!Array.isArray(params) || params.length === 0) {
    return { cleanParams: params, traceContext: undefined };
  }

  const lastParam = params[params.length - 1];
  if (isObject(lastParam) && hasProperty(lastParam, '_traceContext')) {
    const traceContext = parseTraceparent(lastParam._traceContext);
    if (traceContext) {
      return {
        cleanParams: params.slice(0, -1),
        traceContext,
      };
    }
  }

  return { cleanParams: params, traceContext: undefined };
}

/**
 * Run a callback with cross-process trace context active, without creating
 * a span. Auto-instrumented spans (e.g. `http.client`) and any `trace()`
 * callers that fire during the callback will be attached to the propagated
 * trace. Used when the caller wants context propagation but not the wrapper
 * span itself (e.g. when `shouldSampleWrappers` rejects the wrapper but
 * trace continuity for downstream spans is still desired).
 *
 * @param parentContext - Parsed trace context with `traceId` / `parentSpanId`.
 * @param fn - Callback to run within the propagated trace scope.
 * @returns The callback's return value.
 */
export function continueTraceContext<ResultType>(
  parentContext: TraceparentData | undefined,
  fn: () => ResultType,
): ResultType {
  if (!hasTraceparentData(parentContext)) {
    return fn();
  }
  const sentryTrace = traceparentDataToSentryTrace(parentContext);
  return sentryContinueTrace(sentryTrace, () =>
    sentryWithIsolationScope(() => fn()),
  );
}

/**
 * Serialize a trace context from a specific span and request metadata.
 * Includes both name/id (for same-process map lookup) and a W3C `traceparent`
 * string (for cross-process distributed tracing).
 *
 * Note: `main` removed the pre-traceparent form of this function as dead code
 * (#44612); this branch keeps it because `metamask-controller.js` serializes
 * the snap trace context through it.
 *
 * @param span - The Sentry span to build the `traceparent` from.
 * @param request - Request metadata for same-process lookup fallback.
 * @param request.name - The trace name for same-process map lookup.
 * @param request.id - Optional trace ID for same-process map lookup.
 * @returns Serialized trace context.
 */
export function serializeTraceContext(
  span: Sentry.Span | null | undefined,
  request: { name: string; id?: string },
): SerializedTraceContext {
  // Only assign defined fields: `undefined` leaks across the snap response
  // boundary and fails its JSON validation (the snap trace round-trips this).
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const ctx: SerializedTraceContext = { _name: request.name };
  if (request.id !== undefined) {
    ctx._id = request.id;
  }
  if (span) {
    try {
      const traceparent = spanContextToTraceparent(span.spanContext());
      if (traceparent) {
        ctx.traceparent = traceparent;
      }
    } catch {
      // Span may have ended or be invalid
    }
  }
  return ctx;
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

/**
 * Check if value is a valid Sentry Span (has spanContext method).
 *
 * @param value - The value to check.
 * @returns True if value is a Sentry Span.
 */
function isValidSentrySpan(value: unknown): value is Sentry.Span {
  return (
    typeof value === 'object' &&
    value !== null &&
    'spanContext' in value &&
    typeof (value as { spanContext?: unknown }).spanContext === 'function'
  );
}

/**
 * Resolve parentContext to a Sentry Span.
 * Accepts either a Sentry Span or { _name, _id? } object from RPC.
 *
 * @param parentContext - Sentry Span or { _name: TraceName, _id?: string }.
 * @returns Resolved Sentry Span or null.
 */
function resolveParentSpan(parentContext: unknown): Sentry.Span | null {
  if (!parentContext) {
    return null;
  }

  if (isValidSentrySpan(parentContext)) {
    return parentContext;
  }

  if (
    typeof parentContext === 'object' &&
    '_name' in parentContext &&
    typeof (parentContext as { _name?: unknown })._name === 'string'
  ) {
    const ctx = parentContext as { _name: string; _id?: string };
    const parentKey = getTraceKey({
      name: ctx._name as TraceName,
      id: ctx._id,
    });
    const parentTrace = tracesByKey.get(parentKey);
    return parentTrace?.span ?? null;
  }

  return null;
}

/**
 * Subset of a Sentry span context used to build a W3C `traceparent`.
 */
type SpanContextLike = {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
};

/**
 * Parsed trace context whose distributed-tracing ids are guaranteed present.
 */
type ResolvedTraceparentData = {
  traceId: string;
  parentSpanId: string;
  parentSampled?: boolean;
};

/**
 * Whether a W3C `trace-flags` byte has the sampled bit (bit 0) set. Uses
 * modulo rather than a bitwise mask, which lint disallows.
 *
 * @param flags - The decimal value of the `trace-flags` byte.
 * @returns True when the sampled bit is set.
 */
function isSampled(flags: number): boolean {
  return flags % 2 === TRACE_FLAG_SAMPLED;
}

/**
 * Build a W3C `traceparent` string (`{version}-{traceId}-{spanId}-{flags}`)
 * from a Sentry span context. Returns undefined when the IDs are missing.
 *
 * @param spanContext - The span context returned by `span.spanContext()`.
 * @returns A W3C `traceparent` string, or undefined.
 */
function spanContextToTraceparent(
  spanContext: SpanContextLike,
): string | undefined {
  const { traceId, spanId, traceFlags } = spanContext;
  if (!traceId || !spanId) {
    return undefined;
  }
  // Spans only propagate from a recorded UI trace, so treat the sampled bit as
  // set when `traceFlags` is unavailable.
  const flags = isSampled(traceFlags ?? TRACE_FLAG_SAMPLED) ? '01' : '00';
  return `${W3C_TRACEPARENT_VERSION}-${traceId}-${spanId}-${flags}`;
}

/**
 * Validate and unpack a W3C `traceparent` string into Sentry `TraceparentData`.
 * The version byte is dropped and the 2-hex trace-flags reduced to the single
 * `parentSampled` bit. (Sentry v10 removed `@sentry/utils`'
 * `extractTraceparentData`, so the fields are read straight from the match.)
 *
 * @param value - The candidate `_traceContext` value from the last RPC param.
 * @returns Parsed trace context, or undefined when `value` is not a valid W3C
 * `traceparent` string.
 */
function parseTraceparent(value: unknown): TraceparentData | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = W3C_TRACEPARENT_REGEXP.exec(value.trim());
  if (!match) {
    return undefined;
  }
  const [, traceId, parentId, flags] = match;
  return {
    traceId,
    parentSpanId: parentId,
    parentSampled: isSampled(parseInt(flags, 16)),
  };
}

/**
 * Build a Sentry `sentry-trace` header (`{traceId}-{spanId}-{sampled}`) from
 * parsed trace context. Defaults the sampled bit to set, since trace context
 * only propagates from recorded traces.
 *
 * @param data - Parsed trace context with `traceId` and `parentSpanId`.
 * @returns A `sentry-trace` header string.
 */
function traceparentDataToSentryTrace(data: ResolvedTraceparentData): string {
  const sampled = data.parentSampled === false ? '0' : '1';
  return `${data.traceId}-${data.parentSpanId}-${sampled}`;
}

function hasTraceparentData(
  value: unknown,
): value is TraceparentData & ResolvedTraceparentData {
  return (
    isObject(value) &&
    hasProperty(value, 'traceId') &&
    hasProperty(value, 'parentSpanId') &&
    typeof value.traceId === 'string' &&
    typeof value.parentSpanId === 'string'
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function startSpan<T>(
  request: TraceRequest,
  callback: (spanOptions: StartSpanOptions) => T,
) {
  const { data: attributes, name, parentContext, startTime, op } = request;
  let parentSpan = resolveParentSpan(parentContext);

  // Inherit from active span (e.g. browserTracingIntegration's pageload/navigation)
  // when no explicit parent is provided. Must capture before withIsolationScope
  // severs the active span context chain.
  // forceTransaction preserves transaction-level visibility for monitoring while
  // linking to the auto-instrumentation hierarchy.
  let forceTransaction: boolean | undefined;
  if (!parentSpan && !parentContext) {
    const activeSpan = sentryGetActiveSpan();
    if (activeSpan) {
      parentSpan = activeSpan;
      forceTransaction = true;
    }
  }

  const spanOptions: StartSpanOptions = {
    attributes,
    name,
    op: op ?? OP_DEFAULT,
    parentSpan,
    startTime,
    forceTransaction,
  };

  // Cross-process propagation via continueTrace when we have parsed trace
  // context but couldn't resolve a local parent span from the map.
  if (!parentSpan && hasTraceparentData(parentContext)) {
    const sentryTrace = traceparentDataToSentryTrace(parentContext);
    return sentryContinueTrace(sentryTrace, () =>
      sentryWithIsolationScope((scope: Sentry.Scope) => {
        initScope(scope, request);
        return callback({ ...spanOptions, parentSpan: undefined });
      }),
    );
  }

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

export function getPerformanceTimestamp(): number {
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

/**
 * Get the currently active Sentry span, if any.
 * Used by wrappers to avoid trace overhead when no span is active.
 *
 * @returns The active span or null.
 */
export function sentryGetActiveSpan(): Sentry.Span | null {
  const actual = globalThis.sentry?.getActiveSpan;

  if (!actual) {
    return null;
  }

  return actual() ?? null;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function sentryContinueTrace<T>(sentryTrace: string, callback: () => T): T {
  const actual = globalThis.sentry?.continueTrace;

  if (!actual) {
    return callback();
  }

  return actual({ sentryTrace, baggage: undefined }, callback);
}
