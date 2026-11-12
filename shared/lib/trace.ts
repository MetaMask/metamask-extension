import type * as Sentry from '@sentry/browser';
import { SPAN_STATUS_ERROR, SPAN_STATUS_OK } from '@sentry/core';
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
import type {
  SwapTraceRequest,
  SwapRelatedTraceName,
} from '@metamask/bridge-controller';
import { sentryLogger } from './sentry';

/**
 * The supported trace names.
 */
export enum TraceName {
  AccountList = 'Account List',
  AccountOverviewAssetListTab = 'Account Overview Asset List Tab',
  HomepageReady = 'Homepage Ready',
  // Homepage Section Performance
  HomepageSectionTimeToContent = 'Homepage Section Time To Content',
  AccountOverviewNftsTab = 'Account Overview Nfts Tab',
  AccountOverviewActivityTab = 'Account Overview Activity Tab',
  AccountOverviewDeFiTab = 'Account Overview DeFi Tab',
  AccountOverviewPerpsTab = 'Account Overview Perps Tab',
  AssetDetails = 'Asset Details',
  BackgroundConnect = 'Background Connect',
  BackgroundPoll = 'Background Poll',
  BridgeBalancesUpdated = 'Bridge Balances Updated',
  BridgeViewLoaded = 'Bridge View Loaded',
  BridgeTransactionApprovalCompleted = 'Bridge Transaction Approval Completed',
  BridgeTransactionCompleted = 'Bridge Transaction Completed',
  SwapOperationCompleted = 'Swap Operation Completed',
  SwapTransactionApprovalCompleted = 'Swap Transaction Approval Completed',
  SwapTransactionCompleted = 'Swap Transaction Completed',
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
  SwapQuoteFetch = 'Swap Quote Fetch',
  SwapTokenSearch = 'Swap Token Search',
  SwapPopularTokensFetch = 'Swap Popular Tokens Fetch',
  SwapQuotesFetched = 'Swap Quotes Fetched',
  SwapViewLoaded = 'Swap View Loaded',
  Transaction = 'Transaction',
  UIStartup = 'UI Startup',
  // Initial document navigation to the first screen's useful content.
  UsefulScreenReady = 'Useful Screen Ready',
  RevealSeed = 'Reveal Seed',
  ImportSrp = 'Import Srp',
  AddAccount = 'Add Account',
  LoadCollectibles = 'Load Collectibles',
  GetAssetHistoricalPrices = 'Get Asset Historical Prices',
  OnFinishedTransaction = 'On Finished Transaction',
  AccountSyncFull = 'Multichain Account Syncing - Full',
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
  OnboardingSRPAccountCreationTime = 'Onboarding SRP Account Creation Time',
  OnboardingSRPAccountImportTime = 'Onboarding SRP Account Import Time',
  OnboardingResetPassword = 'Onboarding - Reset Password',
  OnboardingCreateKeyAndBackupSrp = 'Onboarding - Create Key and Backup SRP',
  OnboardingAddSrp = 'Onboarding - Add SRP',
  OnboardingFetchSrps = 'Onboarding - Fetch SRPs',
  OnboardingOAuthProviderLogin = 'Onboarding - OAuth Provider Login',
  OnboardingOAuthProviderLaunch = 'Onboarding - OAuth Provider Launch',
  OnboardingOAuthProviderInteraction = 'Onboarding - OAuth Provider Interaction',
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
  StatePersist = 'State Persist',
  // Perps
  PerpsOpenPosition = 'Perps Open Position',
  PerpsClosePosition = 'Perps Close Position',
  PerpsDeposit = 'Perps Deposit',
  PerpsWithdraw = 'Perps Withdraw',
  PerpsPlaceOrder = 'Perps Place Order',
  PerpsEditOrder = 'Perps Edit Order',
  PerpsCancelOrder = 'Perps Cancel Order',
  PerpsUpdateTPSL = 'Perps Update TP/SL',
  PerpsUpdateMargin = 'Perps Update Margin',
  PerpsFlipPosition = 'Perps Flip Position',
  PerpsMarketDataUpdate = 'Perps Market Data Update',
  PerpsOrderView = 'Perps Order View',
  PerpsTabView = 'Perps Tab View',
  PerpsMarketListView = 'Perps Market List View',
  PerpsPositionDetailsView = 'Perps Position Details View',
  PerpsAdjustMarginView = 'Perps Adjust Margin View',
  PerpsOrderDetailsView = 'Perps Order Details View',
  PerpsOrderBookView = 'Perps Order Book View',
  PerpsFlipPositionSheet = 'Perps Flip Position Sheet',
  PerpsTransactionsView = 'Perps Transactions View',
  PerpsOrderFillsFetch = 'Perps Order Fills Fetch',
  PerpsOrdersFetch = 'Perps Orders Fetch',
  PerpsFundingFetch = 'Perps Funding Fetch',
  PerpsGetPositions = 'Perps Get Positions',
  PerpsGetAccountState = 'Perps Get Account State',
  PerpsGetHistoricalPortfolio = 'Perps Get Historical Portfolio',
  PerpsGetMarkets = 'Perps Get Markets',
  PerpsGetMarketDataWithPrices = 'Perps Get Market Data With Prices',
  PerpsFetchHistoricalCandles = 'Perps Fetch Historical Candles',
  PerpsWebSocketConnected = 'Perps WebSocket Connected',
  PerpsWebSocketDisconnected = 'Perps WebSocket Disconnected',
  PerpsWebSocketFirstPositions = 'Perps WebSocket First Positions',
  PerpsWebSocketFirstOrders = 'Perps WebSocket First Orders',
  PerpsWebSocketFirstAccount = 'Perps WebSocket First Account',
  PerpsDataLakeReport = 'Perps Data Lake Report',
  PerpsRewardsAPICall = 'Perps Rewards API Call',
  PerpsClosePositionView = 'Perps Close Position View',
  PerpsWithdrawView = 'Perps Withdraw View',
  PerpsConnectionEstablishment = 'Perps Connection Establishment',
  PerpsAccountSwitchReconnection = 'Perps Account Switch Reconnection',
  PerpsMarketDataPreload = 'Perps Market Data Preload',
  PerpsUserDataPreload = 'Perps User Data Preload',
  PerpsEntryToLiveMarketList = 'Perps Entry To Live Market List',
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
  HomepagePerformance = 'homepage.performance',
  HomepageSectionPerformance = 'homepage.section.performance',
  UiScreenPerformance = 'ui.screen.performance',
  // mUSD Conversion
  MusdConversionOperation = 'musd.conversion.operation',
  MusdConversionDataFetch = 'musd.conversion.data_fetch',
  StateWrite = 'state.write',
  BridgeScreenPerformance = 'bridge.screen.performance',
  BridgeDataFetch = 'bridge.data_fetch',
  // Perps
  PerpsOperation = 'perps.operation',
}

const log = createModuleLogger(sentryLogger, 'trace');

const ID_DEFAULT = 'default';
const OP_DEFAULT = 'custom';
export const ONBOARDING_MACHINE_TIME_ATTRIBUTE = 'onboarding.machine.ms';

/**
 * Machine-time spans summed into the overall onboarding journey. These spans
 * represent application work and deliberately exclude user interaction such
 * as password/SRP entry and external OAuth provider login.
 *
 * OnboardingCreateKeyAndBackupSrp is excluded because it is nested inside
 * OnboardingSRPAccountCreationTime and summing both would double-count it.
 */
const MACHINE_TIME_TRACE_NAMES: ReadonlySet<TraceName> = new Set([
  TraceName.OnboardingSRPAccountCreationTime,
  TraceName.OnboardingSRPAccountImportTime,
  TraceName.OnboardingOAuthProviderLaunch,
  TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
  TraceName.OnboardingOAuthSeedlessAuthenticate,
  TraceName.OnboardingFetchSrps,
  TraceName.OnboardingAddSrp,
  TraceName.OnboardingResetPassword,
]);

const W3C_TRACEPARENT_VERSION = '00';

const TRACE_FLAG_SAMPLED = 0x1;

/** W3C `traceparent`, lowercase hex; captures traceId, parentId, flags. */
const W3C_TRACEPARENT_REGEXP =
  /^[0-9a-f]{2}-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/u;

const tracesByKey: Map<string, PendingTrace> = new Map();
const durationsByName: { [name: string]: number } = {};
let onboardingMachineTimeByKey = new Map<string, number>();

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

export type TraceValue = string | number | boolean;

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
 * Tracing metadata sent by the UI alongside a background RPC request.
 */
export type SerializedTraceMetadata = {
  /**
   * W3C `traceparent` of the originating UI span, present when one is active.
   */
  traceparent?: string;
  /**
   * The dispatched messenger action, when the request uses the messenger.
   */
  messengerAction?: string;
  /**
   * The background operation's display name.
   */
  spanName: `Background RPC: ${string}`;
};

/**
 * {@link SerializedTraceMetadata} as the background reads it, with the
 * `traceparent` parsed.
 */
export type TraceMetadata = Omit<SerializedTraceMetadata, 'traceparent'> & {
  traceContext?: TraceparentData;
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
   * Inherit the active span, as a transaction, when no `parentContext` is given.
   * Defaults to `false`, which starts a parentless span. Set it only where the
   * active span is known to be the correct parent.
   */
  allowActiveSpanFallback?: boolean;

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

  /**
   * Start the span as the root of a new trace, ignoring the active span. A
   * `parentContext` that resolves still takes precedence.
   */
  root?: boolean;
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
   * Final status to record on the span.
   */
  status?: 'ok' | 'error';

  /**
   * Custom data to associate with the trace when ending it.
   * These will be set as attributes on the span.
   */
  data?: Record<string, number | string | boolean>;
};

/**
 * Return the active span for a pending manual trace.
 *
 * This is useful when a child trace is started after navigation or another
 * async boundary and the parent must be resolved from the local trace registry
 * instead of being threaded through route parameters.
 * @param request
 */
export function getTraceContext(
  request: Pick<TraceRequest, 'name' | 'id'>,
): TraceContext {
  return tracesByKey.get(getTraceKey(request))?.span;
}

/**
 * Attach attributes to an active trace without requiring callers to retain the
 * raw Sentry span. Missing or non-Sentry contexts are intentionally ignored.
 * @param context
 * @param attributes
 */
export function annotateTrace(
  context: TraceContext,
  attributes: Record<string, TraceValue>,
): void {
  if (!isValidSentrySpan(context)) {
    return;
  }

  for (const [key, value] of Object.entries(attributes)) {
    context.setAttribute(key, value);
  }
}

type GenericTraceName = TraceRequest['name'];

/**
 * Overloads the {@link TraceRequest} type for swap-related trace names.
 * The {@link SwapTraceRequest} type defines required properties for swap-related traces
 */
type TraceRequestFor<TName extends GenericTraceName> = [TName] extends [
  SwapRelatedTraceName<TraceName>,
]
  ? Omit<SwapTraceRequest<TName>, 'op'> & { op?: TraceOperation }
  : Omit<TraceRequest, 'name'> & { name: TName };

export function trace<ResultType, TName extends GenericTraceName>(
  request: TraceRequestFor<TName>,
  fn: TraceCallback<ResultType>,
): ResultType;

export function trace<TName extends GenericTraceName>(
  request: TraceRequestFor<TName>,
): TraceContext;

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

function sumOnboardingMachineTime(): number {
  let total = 0;

  for (const duration of onboardingMachineTimeByKey.values()) {
    total += duration;
  }

  return total;
}

function recordOnboardingMachineTime(
  request: Pick<TraceRequest, 'name' | 'id'>,
  duration: number,
): void {
  onboardingMachineTimeByKey.set(getTraceKey(request), Math.max(duration, 0));
}

function addOnboardingMachineTime(
  request: EndTraceRequest,
  duration: number,
): void {
  if (
    !MACHINE_TIME_TRACE_NAMES.has(request.name) ||
    request.data?.success === false ||
    !Number.isFinite(duration)
  ) {
    return;
  }

  recordOnboardingMachineTime(request, duration);
}

function addOpenOnboardingMachineTime(
  request: EndTraceRequest,
  journeyEndTime: number,
): void {
  if (request.data?.success === false) {
    return;
  }

  for (const pendingTrace of tracesByKey.values()) {
    if (!MACHINE_TIME_TRACE_NAMES.has(pendingTrace.request.name as TraceName)) {
      continue;
    }

    const duration = journeyEndTime - pendingTrace.startTime;
    if (Number.isFinite(duration)) {
      recordOnboardingMachineTime(pendingTrace.request, duration);
    }
  }
}

function finalizeOnboardingMachineTime(span?: Span | null): void {
  if (span && typeof span.setAttribute === 'function') {
    span.setAttribute(
      ONBOARDING_MACHINE_TIME_ATTRIBUTE,
      Math.round(sumOnboardingMachineTime()),
    );
  }

  onboardingMachineTimeByKey = new Map();
}

/**
 * Run one background polling cycle as its own `Background Poll` root trace.
 *
 * @param controllerName - The polling controller, recorded as `controller` span data.
 * @param fn - The polling cycle to trace.
 * @returns The result of the polling cycle.
 */
export function traceBackgroundPoll<ResultType>(
  controllerName: string,
  fn: () => ResultType,
): ResultType {
  return trace(
    {
      name: TraceName.BackgroundPoll,
      op: 'background.poll',
      // Span data, not a scope tag: a tag stays on the scope while the poll is
      // pending and lands on unrelated concurrent transactions.
      data: { controller: controllerName },
      root: true,
    },
    fn,
  );
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
 * Children of a segment root that were still running when the root ended and
 * were handed to the standalone-span path, so they are sent when they end.
 */
export const IN_FLIGHT_STANDALONE_ATTRIBUTE =
  'trace.in_flight_children.standalone';

/**
 * Children of a segment root that were still running when the root ended and
 * could not be handed off, so the SDK will never send them.
 */
export const IN_FLIGHT_LOST_ATTRIBUTE = 'trace.in_flight_children.lost';

/**
 * Finished children past the SDK's per-transaction cap, which it cuts without
 * reporting.
 */
export const OVER_SPAN_LIMIT_ATTRIBUTE = 'trace.children_over_span_limit';

/**
 * `MAX_SPAN_COUNT` in `@sentry/core`'s `SentrySpan`, which is not exported.
 */
const MAX_CHILD_SPANS_PER_TRANSACTION = 1000;

type StandaloneCapableSpan = Span & {
  // Private `SentrySpan` field read by its `_onSpanEnded`.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _isStandaloneSpan?: boolean;
  isStandaloneSpan?: () => boolean;
};

function isStandaloneSpan(span: Span): boolean {
  const { isStandaloneSpan: check } = span as StandaloneCapableSpan;
  return typeof check === 'function' && check.call(span);
}

/**
 * Mark a span standalone so the SDK sends it in its own envelope when it ends.
 * There is no public setter, so this writes the field `isStandaloneSpan()`
 * reads and confirms the write took; an SDK that renames the field makes this
 * return false, which the caller counts as a loss.
 *
 * @param span - A running child span.
 * @returns Whether the span is now standalone.
 */
function markStandalone(span: Span): boolean {
  const candidate = span as StandaloneCapableSpan;
  if (typeof candidate.isStandaloneSpan !== 'function') {
    return false;
  }
  candidate._isStandaloneSpan = true;
  return candidate.isStandaloneSpan();
}

/**
 * Keep the still-running children of a segment root from being lost when it
 * ends. Ending a root serializes it into a transaction at that instant and
 * leaves out every child without an end time, and nothing sends such a child
 * later. Those are the slow requests, so losing them hides them and biases
 * latency percentiles toward the fast half.
 *
 * Each running child is switched to the SDK's standalone-span path instead: it
 * is sent alone when it ends, under its original span and trace ids, so
 * backends that received its `traceparent` still find their parent.
 *
 * Records the outcome on the root as counts, zero included, so a loss is a
 * measured value rather than an absence. Does nothing for a span that is not
 * a segment root: its children still belong to the root's transaction.
 *
 * @param span - The span about to end.
 */
function preserveInFlightChildren(span: Span | null | undefined): void {
  const getRootSpan = globalThis.sentry?.getRootSpan;
  const getSpanDescendants = globalThis.sentry?.getSpanDescendants;

  if (!span || !getRootSpan || !getSpanDescendants) {
    return;
  }

  if (getRootSpan(span) !== span) {
    return;
  }

  let standalone = 0;
  let lost = 0;
  let finished = 0;

  // Only sampled spans are returned, so a non-recording one has ended.
  for (const child of getSpanDescendants(span)) {
    if (child === span || isStandaloneSpan(child)) {
      continue;
    }
    if (!child.isRecording()) {
      finished += 1;
    } else if (markStandalone(child)) {
      standalone += 1;
    } else {
      lost += 1;
    }
  }

  span.setAttribute(IN_FLIGHT_STANDALONE_ATTRIBUTE, standalone);
  span.setAttribute(IN_FLIGHT_LOST_ATTRIBUTE, lost);
  span.setAttribute(
    OVER_SPAN_LIMIT_ATTRIBUTE,
    Math.max(0, finished - MAX_CHILD_SPANS_PER_TRANSACTION),
  );
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

  if (request.status && pendingTrace.span) {
    pendingTrace.span.setStatus({
      code: request.status === 'ok' ? SPAN_STATUS_OK : SPAN_STATUS_ERROR,
    });
  }

  const endTime = timestamp ?? getPerformanceTimestamp();

  if (name === TraceName.OnboardingJourneyOverall) {
    addOpenOnboardingMachineTime(request, endTime);
    finalizeOnboardingMachineTime(pendingTrace.span);
  }

  preserveInFlightChildren(pendingTrace.span);
  pendingTrace.end(endTime);

  tracesByKey.delete(key);

  const { request: pendingRequest, startTime } = pendingTrace;

  logTrace(pendingRequest, startTime, endTime);
  addOnboardingMachineTime(request, endTime - startTime);
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
 * Run the callback with no active span, so a `submitRequestToBackground` call
 * inside it carries no trace context and the background emits no wrapper spans
 * for it. The callback runs inside a void wrapper because Sentry keeps the
 * forked scope until a returned promise settles, which would hide the active
 * span from unrelated UI work in the meantime.
 *
 * @param callback - Code whose background calls should not join the active trace.
 * @returns The callback's return value.
 */
export function withoutTraceContext<ReturnValue>(
  callback: () => ReturnValue,
): ReturnValue {
  const withActiveSpan = globalThis.sentry?.withActiveSpan;
  if (!withActiveSpan) {
    return callback();
  }
  let result: ReturnValue | undefined;
  withActiveSpan(null, () => {
    result = callback();
  });
  return result as ReturnValue;
}

/**
 * Extract tracing metadata appended by submitRequestToBackground.
 *
 * Only a valid trailing `_trace` wrapper is removed, preserving ordinary
 * application arguments that happen to contain a similarly named property.
 * A `traceparent` in it must be a valid W3C `traceparent` string.
 *
 * @param params - RPC call parameters.
 * @returns Clean params and the tracing metadata, with the `traceparent`
 * parsed, if present.
 */
export function extractTraceMetadata(
  params: unknown,
):
  | { cleanParams: unknown[]; traceMetadata: TraceMetadata }
  | { cleanParams: unknown; traceMetadata: undefined } {
  if (!Array.isArray(params) || params.length === 0) {
    return { cleanParams: params, traceMetadata: undefined };
  }

  const lastParam = params[params.length - 1];
  if (
    isObject(lastParam) &&
    hasProperty(lastParam, '_trace') &&
    isObject(lastParam._trace) &&
    hasProperty(lastParam._trace, 'spanName') &&
    typeof lastParam._trace.spanName === 'string' &&
    lastParam._trace.spanName.startsWith('Background RPC: ') &&
    (!hasProperty(lastParam._trace, 'messengerAction') ||
      typeof lastParam._trace.messengerAction === 'string')
  ) {
    const traceContext = hasProperty(lastParam._trace, 'traceparent')
      ? parseTraceparent(lastParam._trace.traceparent)
      : undefined;
    if (!hasProperty(lastParam._trace, 'traceparent') || traceContext) {
      return {
        cleanParams: params.slice(0, -1),
        traceMetadata: {
          // Type assertion: the prefix check above validates this template literal.
          spanName: lastParam._trace
            .spanName as SerializedTraceMetadata['spanName'],
          ...(hasProperty(lastParam._trace, 'messengerAction') &&
            typeof lastParam._trace.messengerAction === 'string' && {
              messengerAction: lastParam._trace.messengerAction,
            }),
          ...(traceContext && { traceContext }),
        },
      };
    }
  }

  return { cleanParams: params, traceMetadata: undefined };
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
 * Serialize a span for a later `parentContext`: name/id for same-process
 * lookup, plus the span's W3C `traceparent`.
 *
 * @param span - The Sentry span to build the `traceparent` from.
 * @param request - Request metadata for same-process lookup.
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
        // Runs before the SDK ends the span on return or settlement.
        preserveInFlightChildren(span);
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

  if (name === TraceName.OnboardingJourneyOverall) {
    onboardingMachineTimeByKey = new Map();
  }

  const callback = (span: Sentry.Span | null) => {
    const end = (timestamp?: number) => {
      span?.end(timestamp);
    };

    if (span) {
      initSpan(span, request);
    }

    const pendingTrace = { end, request, startTime, span };
    const key = getTraceKey(request);

    // Same name and `id` (or both without one) means the same key: this `set`
    // drops the pending trace, whose span then never ends.
    if (tracesByKey.has(key)) {
      log('WARNING: trace key collision, dropping pending trace', key);
      span?.setAttribute('trace.key_collision', true);
    }

    tracesByKey.set(key, pendingTrace);

    log('Started trace', name, id, request);

    return span;
  };

  return startSpan({ ...request, startTime }, (spanOptions) =>
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
  if (parentContext === null || parentContext === undefined) {
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

function spanContextToTraceparent(
  spanContext: SpanContextLike,
): string | undefined {
  const { traceId, spanId, traceFlags } = spanContext;
  if (!traceId || !spanId) {
    return undefined;
  }
  // Sentry always sets `traceFlags`; treat an input without it as sampled.
  const flags = isSampled(traceFlags ?? TRACE_FLAG_SAMPLED) ? '01' : '00';
  return `${W3C_TRACEPARENT_VERSION}-${traceId}-${spanId}-${flags}`;
}

/**
 * Parse a W3C `traceparent`, keeping only the sampled bit of its flags.
 *
 * @param value - The candidate `traceparent`.
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
 * Build a `sentry-trace` header. An unset `parentSampled` encodes as sampled.
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
  const {
    data: attributes,
    name,
    parentContext,
    startTime,
    op,
    allowActiveSpanFallback,
    root,
  } = request;
  let parentSpan = resolveParentSpan(parentContext);

  // `undefined` means no parent was declared; `null` means one was intended but
  // has no span. `resolveParentSpan` returns `null` for both, so read the input.
  const parentDeclared = parentContext !== undefined;

  // Read the active span before `withScope` forks the scope. `forceTransaction`
  // keeps an inherited span in transaction-level dashboards.
  let forceTransaction: boolean | undefined;
  if (!root && !parentSpan && !parentDeclared && allowActiveSpanFallback) {
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
    ...(forceTransaction === undefined ? {} : { forceTransaction }),
  };

  // No local parent: continue from parsed `TraceparentData`, or from the
  // `traceparent` a snap's `SerializedTraceContext` keeps after its parent ended.
  if (!parentSpan) {
    let traceparentData;
    if (hasTraceparentData(parentContext)) {
      traceparentData = parentContext;
    } else if (
      isObject(parentContext) &&
      hasProperty(parentContext, 'traceparent')
    ) {
      const parsed = parseTraceparent(parentContext.traceparent);
      if (hasTraceparentData(parsed)) {
        traceparentData = parsed;
      }
    }
    if (traceparentData) {
      const sentryTrace = traceparentDataToSentryTrace(traceparentData);
      return sentryContinueTrace(sentryTrace, () =>
        sentryWithScope((scope: Sentry.Scope) => {
          initScope(scope, request);
          return callback({ ...spanOptions, parentSpan: undefined });
        }),
      );
    }
  }

  // A declared parent that did not resolve nests under the active span, without
  // `forceTransaction`: a failed lookup is not a request for a root.
  if (!root && !parentSpan && parentDeclared) {
    const activeSpan = sentryGetActiveSpan();
    if (activeSpan) {
      return sentryWithScope((scope: Sentry.Scope) => {
        initScope(scope, request);
        return callback({ ...spanOptions, parentSpan: activeSpan });
      });
    }
  }

  const runInScope = () =>
    sentryWithScope((scope: Sentry.Scope) => {
      initScope(scope, request);
      return callback(spanOptions);
    });

  // `withScope` alone keeps the ambient trace id; `startNewTrace` issues a new
  // one, which is what moves a `root` span off the ambient trace.
  return root ? sentryStartNewTrace(runInScope) : runInScope();
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function sentryStartNewTrace<T>(callback: () => T): T {
  const actual = globalThis.sentry?.startNewTrace;

  if (!actual) {
    return callback();
  }

  return actual(callback);
}

/**
 * Run the callback in a forked current scope, so tags set on it reach this
 * trace's own events only. The browser SDK's `withIsolationScope` hands the
 * callback the existing isolation scope rather than a fork, so a tag set there
 * stays on every later event in the process.
 *
 * @param callback - Receives the forked scope.
 * @returns The callback's return value.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function sentryWithScope<T>(callback: (scope: Sentry.Scope) => T): T {
  const actual = globalThis.sentry?.withScope;

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

/**
 * Baggage for a continued trace. It must carry `sentry-sampled`, which backends
 * route spans to Sentry on.
 *
 * @param sentryTrace - A `{traceId}-{spanId}-{sampled}` header.
 * @returns A `baggage` string, or undefined when the header is malformed.
 */
function sentryTraceToBaggage(sentryTrace: string): string | undefined {
  const [traceId, , sampled] = sentryTrace.split('-');
  if (!traceId || (sampled !== '0' && sampled !== '1')) {
    return undefined;
  }
  return `sentry-trace_id=${traceId},sentry-sampled=${sampled === '1'}`;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function sentryContinueTrace<T>(sentryTrace: string, callback: () => T): T {
  const actual = globalThis.sentry?.continueTrace;

  if (!actual) {
    return callback();
  }

  return actual(
    { sentryTrace, baggage: sentryTraceToBaggage(sentryTrace) },
    callback,
  );
}
