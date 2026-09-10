import type {
  PerpsController,
  PerpsControllerState,
  CandlePeriod,
  TimeDuration,
  PerpsMarketData,
} from '@metamask/perps-controller';
import type { Patch } from 'immer';

// Defined locally to avoid a value import from @metamask/perps-controller,
// which transitively pulls in the Hyperliquid SDK (ESM-only) and breaks Jest.
const WebSocketConnectionState = {
  Connected: 'connected',
  Connecting: 'connecting',
  Disconnected: 'disconnected',
  Disconnecting: 'disconnecting',
} as const;
type WebSocketConnectionState =
  (typeof WebSocketConnectionState)[keyof typeof WebSocketConnectionState];

type EmitFn = (
  channel: string,
  data: unknown,
  extra?: Record<string, unknown>,
) => void;

type ActivateStreamingParams = {
  priceSymbols?: string[];
  includeMarketData?: boolean;
  orderBookSymbol?: string;
  candle?: { symbol: string; interval: CandlePeriod; duration?: TimeDuration };
};

type StateChangeListener = (
  callback: (state: PerpsControllerState, patches: Patch[]) => void,
) => () => void;

type ConnectivityChangeListener = (
  callback: (state: { connectivityStatus: string }) => void,
) => () => void;

/**
 * Opens the server-aggregated order-book subscription on a dedicated
 * Hyperliquid WebSocket connection (separate from the controller's shared
 * socket) and returns an unsubscribe function. Injected so this file never
 * value-imports the ESM-only Hyperliquid SDK, keeping the bridge Jest-friendly.
 */
type SubscribeAggregatedOrderBook = (params: {
  symbol: string;
  levels?: number;
  nSigFigs?: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
  callback: (data: unknown) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'error') => void;
}) => () => void;

type PerpsStreamBridgeOptions = {
  controller: PerpsController;
  getSelectedAddress: () => string;
  onControllerStateChange: StateChangeListener;
  onConnectivityChange: ConnectivityChangeListener;
  perpsInit: (...args: unknown[]) => Promise<unknown>;
  perpsDisconnect: (...args: unknown[]) => Promise<unknown>;
  perpsToggleTestnet: (...args: unknown[]) => Promise<unknown>;
  isConnectionAlive: () => boolean;
  isTerminalBackendEnabled: () => boolean;
  isPreloadAllowed: () => boolean;
  subscribeAggregatedOrderBook: SubscribeAggregatedOrderBook;
  emit: EmitFn;
};

// UI bridges are connection-scoped; this owner survives UI reloads, but not
// replacement of the shared background controller. Never persist telemetry state.
const settledControllers = new WeakSet<PerpsController>();
type AccountSession = {
  address?: string;
  needsTeardown: boolean;
  queue: Promise<unknown>;
};
const accountSessions = new WeakMap<PerpsController, AccountSession>();
const controllerBridges = new WeakMap<
  PerpsController,
  Set<PerpsStreamBridge>
>();

const REST_HYDRATION_STAGGER_MS = 200;

// Deferred candle-teardown window. A quick deactivate → activate round-trip
// (e.g. React re-mount) within this window cancels the teardown, avoiding a
// needless unsubscribe/resubscribe burst on HyperLiquid.
//
// Kept 30 ms longer than the UI-layer CONNECT_DEBOUNCE_MS (120 ms) in
// ui/providers/perps/CandleStreamChannel.ts so a UI resubscribe debounced
// by 120 ms still arrives before the bridge commits the teardown.
const CANDLE_TEARDOWN_DEFER_MS = 150;

/**
 * Per-connection bridge between the background PerpsController's WebSocket
 * subscriptions and a single UI outStream.
 *
 * Manages two categories of subscriptions:
 * Static (positions/orders/account): registered once via #activate() after
 * perpsInit resolves and the provider is ready.
 * Dynamic (prices/orderBook): single slot per channel; replaced on each call.
 * Candles: multiplexed by symbol+interval so multiple chart keys can stream
 * concurrently; each deactivate tears down only that key.
 *
 * Foreground emission is gated by isActive. An independent wallet-root
 * preload owner keeps market/account/price channels warm without opening a
 * Perps view or replacing the foreground price subscription.
 */
export class PerpsStreamBridge {
  #viewActive = false;

  // perpsInit owns wallet streams until disconnect, independently of preload.
  #walletInitialized = false;

  #preloadId: string | null = null;

  #preloadPriceUnsubscribe: (() => void) | null = null;

  #foregroundPriceSymbols = new Set<string>();

  #preloadSymbols = '';

  #preloadReady = false;

  #activatedAt = 0;

  readonly #isPreloadAllowed: () => boolean;

  readonly #controller: PerpsController;

  readonly #getSelectedAddress: () => string;

  readonly #onControllerStateChange: StateChangeListener;

  readonly #onConnectivityChange: ConnectivityChangeListener;

  readonly #perpsInit: PerpsStreamBridgeOptions['perpsInit'];

  readonly #perpsDisconnect: PerpsStreamBridgeOptions['perpsDisconnect'];

  readonly #perpsToggleTestnet: PerpsStreamBridgeOptions['perpsToggleTestnet'];

  readonly #isConnectionAlive: () => boolean;

  readonly #isTerminalBackendEnabled: () => boolean;

  readonly #subscribeAggregatedOrderBook: SubscribeAggregatedOrderBook;

  readonly #emit: EmitFn;

  readonly #staticUnsubs: (() => void)[] = [];

  readonly #dynamicUnsubs: Record<string, () => void> = {};

  #dynamicSubscriptions: Record<string, () => () => void> = {};

  #accountViewActive = false;

  /**
   * Per-channel activation generation for the deferred dynamic subscriptions
   * (prices / orderBook / orderBookAggregated). Each `perpsDeactivate*Stream`
   * bumps its channel's counter, so an activation whose `#initAndActivate()`
   * only resolves *after* that deactivation ran will see the mismatch and
   * refuse to subscribe. Without this, opening and quickly closing a panel
   * during cold init would let the activation continuation resurrect the
   * subscription after teardown, leaking a hidden stream that survives until
   * the next (de)activation or bridge destruction. Mirrors the candle path's
   * `#destroyGeneration` guard, but scoped per channel so an unrelated
   * channel's teardown never cancels this activation.
   */
  readonly #dynamicActivationGeneration: Record<string, number> = {};

  readonly #pendingCandleTeardowns = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  /**
   * Concurrent-activation guard for candle streams. The synchronous
   * `#dynamicUnsubs[key]` check only trips after `#activateCandleStream` has
   * run, which happens *after* `await #initAndActivate()`. Without this map,
   * two callers for the same {symbol, interval} arriving before init resolves
   * both pass the early-return and each issue a `subscribeToCandles` (and its
   * backing `candleSnapshot` REST hit) — exactly the rate-limit burst this
   * PR is trying to eliminate on cold init / reconnect / rapid market switch.
   */
  readonly #pendingCandleActivations = new Map<string, Promise<void>>();

  #activated = false;

  /**
   * Bumped by destroy(); any candle activation that captured a prior generation
   * and was awaiting init when destroy() ran will see the mismatch and refuse
   * to subscribe. A counter (rather than a boolean) means the flag self-resets
   * on the next init — so perpsDisconnect/perpsToggleTestnet followed by a
   * fresh perpsInit does not permanently suppress candle subscribes.
   */
  #destroyGeneration = 0;

  #wasDisconnected = false;

  #isHydrating = false;

  /** Bumped on each hydration start and on destroy() so stale #finally blocks cannot clear #isHydrating. */
  #hydrationSeq = 0;

  #lastMarketCacheKey: string | null = null;

  /**
   * Serializes the Terminal-mode market refetch triggered by preload-cache
   * bumps so a burst of state changes cannot fan out into concurrent Terminal
   * REST hits (the exact rate-limit pressure this stack is trying to avoid).
   */
  #terminalMarketRefetchInFlight = false;

  /**
   * Set when a preload-cache bump arrives while a Terminal market refetch is
   * already in flight. The in-flight fetch re-runs once on settle so the newest
   * market set (e.g. post-HIP-3) still reaches the UI instead of being dropped.
   */
  #terminalMarketRefetchPending = false;

  #wasDeviceOffline = false;

  /**
   * Invalidate every UI's subscription ownership before global provider teardown.
   *
   * @param controller - Shared background controller whose provider is stopping.
   */
  static invalidateController(controller: PerpsController): void {
    const session = accountSessions.get(controller);
    if (session) {
      session.address = undefined;
    }
    for (const bridge of controllerBridges.get(controller) ?? []) {
      bridge.destroy();
    }
  }

  /** Remove a closed UI connection from the background's bridge registry. */
  dispose(): void {
    this.destroy();
    controllerBridges.get(this.#controller)?.delete(this);
  }

  constructor(options: PerpsStreamBridgeOptions) {
    this.#controller = options.controller;
    this.#getSelectedAddress = options.getSelectedAddress;
    this.#onControllerStateChange = options.onControllerStateChange;
    this.#onConnectivityChange = options.onConnectivityChange;
    this.#perpsInit = options.perpsInit;
    this.#perpsDisconnect = options.perpsDisconnect;
    this.#perpsToggleTestnet = options.perpsToggleTestnet;
    this.#isConnectionAlive = options.isConnectionAlive;
    this.#isTerminalBackendEnabled = options.isTerminalBackendEnabled;
    this.#isPreloadAllowed = options.isPreloadAllowed;
    this.#subscribeAggregatedOrderBook = options.subscribeAggregatedOrderBook;
    this.#emit = options.emit;
    const bridges =
      controllerBridges.get(this.#controller) ?? new Set<PerpsStreamBridge>();
    bridges.add(this);
    controllerBridges.set(this.#controller, bridges);
  }

  /**
   * Returns API method overrides for the metamask-controller RPC api object.
   * Encapsulates all perps-specific orchestration logic (init guards,
   * streaming lifecycle, view activation) so metamask-controller.js only
   * needs to spread this into the api object.
   *
   * @returns Record of perps stream method overrides
   */
  bridgeApi(): Record<string, (...args: never[]) => unknown> {
    return {
      perpsInitForAccount: (address: string) => this.#initForAccount(address),
      perpsGetLifecycleContext: async () =>
        settledControllers.has(this.#controller) ? 'warm' : 'cold_process',
      perpsMarkForegroundSettled: async () => {
        settledControllers.add(this.#controller);
      },
      perpsInit: async (...args: unknown[]) => {
        if (!this.#isPreloadAllowed()) {
          throw new Error('Perps connection is unavailable');
        }
        const generation = this.#destroyGeneration;
        // Mobile starts controller cache preload before connecting the
        // foreground provider, allowing independent user/market REST warming.
        await Promise.resolve()
          .then(() => {
            if (
              generation === this.#destroyGeneration &&
              this.#isConnectionAlive() &&
              this.#isPreloadAllowed()
            ) {
              return this.#controller.startMarketDataPreload();
            }
          })
          .catch((error) => {
            console.debug(
              '[PerpsStreamBridge] startMarketDataPreload failed',
              error,
            );
          });
        if (
          generation !== this.#destroyGeneration ||
          !this.#isConnectionAlive() ||
          !this.#isPreloadAllowed()
        ) {
          throw new Error('Perps connection was released');
        }
        const result = await this.#perpsInit(...args);
        if (
          generation !== this.#destroyGeneration ||
          !this.#isConnectionAlive() ||
          !this.#isPreloadAllowed()
        ) {
          throw new Error('Perps connection was released');
        }
        this.#walletInitialized = true;
        if (!this.#activated) {
          this.#activate();
        }
        return result;
      },
      perpsDisconnect: async (...args: unknown[]) => {
        this.destroy();
        return this.#perpsDisconnect(...args);
      },
      perpsToggleTestnet: async (...args: unknown[]) => {
        this.destroy();
        return this.#perpsToggleTestnet(...args);
      },
      perpsViewActive: (active: boolean) => {
        this.#viewActive = active;
        if (!active) {
          this.#accountViewActive = false;
        }
      },
      perpsStartPreload: (id: string) => this.#startPreload(id),
      perpsStopPreload: (id: string) => {
        if (this.#preloadId === id) {
          this.#releasePreload();
          if (
            !this.#viewActive &&
            (!this.#walletInitialized || !this.#isPreloadAllowed())
          ) {
            this.destroy();
          }
        }
      },
      perpsActivateStreaming: async (params: ActivateStreamingParams) => {
        await this.#initAndActivate();
        if (this.#isConnectionAlive()) {
          this.#activateStreaming(params);
        }
      },
      perpsActivatePriceStream: ({
        symbols,
        includeMarketData,
      }: {
        symbols: string[];
        includeMarketData?: boolean;
      }) =>
        this.#activateDynamicWhenReady('prices', () =>
          this.#activatePriceStream(symbols, includeMarketData),
        ),
      perpsDeactivatePriceStream: () => {
        this.#deactivateDynamicChannel('prices');
      },
      perpsActivateOrderBookStream: ({
        symbol,
        levels,
        nSigFigs,
        mantissa,
      }: {
        symbol: string;
        levels?: number;
        nSigFigs?: 2 | 3 | 4 | 5;
        mantissa?: 2 | 5;
      }) =>
        this.#activateDynamicWhenReady('orderBook', () =>
          this.#activateOrderBookStream({ symbol, levels, nSigFigs, mantissa }),
        ),
      perpsDeactivateOrderBookStream: () => {
        this.#deactivateDynamicChannel('orderBook');
      },
      perpsActivateOrderBookAggregatedStream: ({
        symbol,
        levels,
        nSigFigs,
        mantissa,
        subscriptionId,
      }: {
        symbol: string;
        levels?: number;
        nSigFigs?: 2 | 3 | 4 | 5;
        mantissa?: 2 | 5;
        /**
         * UI-generated identity for this activate request. Echoed on every
         * data/status emission so the UI can discard packets from a prior
         * grouping that arrive during the async deactivate/activate IPC gap.
         */
        subscriptionId?: string;
      }) =>
        this.#activateDynamicWhenReady('orderBookAggregated', () =>
          this.#activateOrderBookAggregatedStream({
            symbol,
            levels,
            nSigFigs,
            mantissa,
            subscriptionId,
          }),
        ),
      perpsDeactivateOrderBookAggregatedStream: () => {
        this.#deactivateDynamicChannel('orderBookAggregated');
      },
      perpsActivateCandleStream: async ({
        symbol,
        interval,
        duration,
      }: {
        symbol: string;
        interval: CandlePeriod;
        duration?: TimeDuration;
      }) => {
        const key = this.#candleSubscriptionKey(symbol, interval);

        const pendingTimer = this.#pendingCandleTeardowns.get(key);
        if (pendingTimer !== undefined) {
          clearTimeout(pendingTimer);
          this.#pendingCandleTeardowns.delete(key);
        }

        if (this.#dynamicUnsubs[key]) {
          return;
        }

        const existing = this.#pendingCandleActivations.get(key);
        if (existing !== undefined) {
          await existing;
          return;
        }

        const generationAtStart = this.#destroyGeneration;
        const activation = (async () => {
          await this.#initAndActivate();
          // destroy() may have fired during the await; never subscribe after
          // the bridge has been torn down (the subscribe would leak past the
          // point where static/dynamic unsubs are cleared). Using a generation
          // counter rather than a latched boolean lets later init cycles
          // re-enable subscribes without needing an explicit reset.
          if (this.#destroyGeneration !== generationAtStart) {
            return;
          }
          // Another caller may have raced us through activation; re-check
          // before issuing the subscribe so we never double-subscribe.
          if (this.#dynamicUnsubs[key]) {
            return;
          }
          if (this.#isConnectionAlive()) {
            this.#activateCandleStream({ symbol, interval, duration });
          }
        })();
        this.#pendingCandleActivations.set(key, activation);
        try {
          await activation;
        } finally {
          if (this.#pendingCandleActivations.get(key) === activation) {
            this.#pendingCandleActivations.delete(key);
          }
        }
      },
      perpsDeactivateCandleStream: ({
        symbol,
        interval,
      }: {
        symbol: string;
        interval: CandlePeriod;
      }) => {
        if (!symbol || !interval) {
          return;
        }
        const key = this.#candleSubscriptionKey(symbol, interval);

        const existing = this.#pendingCandleTeardowns.get(key);
        if (existing !== undefined) {
          clearTimeout(existing);
        }

        this.#pendingCandleTeardowns.set(
          key,
          setTimeout(() => {
            this.#pendingCandleTeardowns.delete(key);
            delete this.#dynamicSubscriptions[key];
            this.#tearDownDynamicKey(key);
          }, CANDLE_TEARDOWN_DEFER_MS),
        );
      },
      perpsCheckHealth: () => {
        if (!this.#activated) {
          return;
        }
        const state = this.#controller.getWebSocketConnectionState();
        if (state === WebSocketConnectionState.Disconnected) {
          this.#controller.reconnect().catch((err) => {
            console.debug(
              '[PerpsStreamBridge] health-check reconnect failed',
              err,
            );
          });
        }
      },
    };
  }

  get isActive(): boolean {
    return this.#activated && this.#viewActive;
  }

  /**
   * Keep wallet-level data flowing independently of foreground detail streams.
   *
   * @param channel - Notification channel.
   * @returns Whether this UI connection owns the channel.
   */
  canEmit(channel: string): boolean {
    return (
      (channel === 'accountSession' &&
        this.#isConnectionAlive() &&
        this.#isPreloadAllowed()) ||
      this.isActive ||
      Boolean(
        this.#activated &&
        (this.#walletInitialized || this.#preloadId) &&
        this.#isPreloadAllowed() &&
        [
          'positions',
          'orders',
          'account',
          'markets',
          'prices',
          'connectionState',
        ].includes(channel),
      )
    );
  }

  destroy(): void {
    this.#destroyGeneration += 1;
    this.#releasePreload();

    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    this.#tearDownAllDynamic();
    this.#dynamicSubscriptions = {};
    this.#accountViewActive = false;

    this.#activated = false;
    this.#walletInitialized = false;
    this.#viewActive = false;
    this.#wasDisconnected = false;
    this.#hydrationSeq += 1;
    this.#isHydrating = false;
    this.#lastMarketCacheKey = null;
    this.#terminalMarketRefetchInFlight = false;
    this.#terminalMarketRefetchPending = false;
    this.#wasDeviceOffline = false;
  }

  #detachForAccountSwitch(): void {
    const subscriptions = { ...this.#dynamicSubscriptions };
    for (const key of this.#pendingCandleTeardowns.keys()) {
      delete subscriptions[key];
    }
    const viewActive = this.#viewActive || this.#accountViewActive;
    this.destroy();
    this.#dynamicSubscriptions = subscriptions;
    this.#accountViewActive = viewActive;
  }

  #getAccountSession(): AccountSession {
    const session = accountSessions.get(this.#controller) ?? {
      queue: Promise.resolve(),
      needsTeardown: false,
    };
    accountSessions.set(this.#controller, session);
    return session;
  }

  /**
   * Serialize account transitions for all UI connections sharing the controller.
   * @param address
   */
  async #initForAccount(address: string): Promise<unknown> {
    const session = this.#getAccountSession();
    const isCurrent = () =>
      this.#isConnectionAlive() &&
      this.#isPreloadAllowed() &&
      address.toLowerCase() === this.#getSelectedAddress().toLowerCase();
    const operation = session.queue
      .catch(() => undefined)
      .then(async () => {
        if (!isCurrent()) {
          throw new Error('Perps account changed');
        }
        const changesSharedSession =
          session.needsTeardown || session.address !== address.toLowerCase();
        try {
          if (
            session.needsTeardown ||
            (session.address && session.address !== address.toLowerCase())
          ) {
            for (const bridge of controllerBridges.get(this.#controller) ??
              []) {
              bridge.#detachForAccountSwitch();
            }
            await this.#perpsDisconnect();
            if (!isCurrent()) {
              throw new Error('Perps account changed');
            }
          }
          // Admission must precede activation: init may synchronously emit
          // snapshots, so this control message cannot depend on #activated.
          this.#emit('accountSession', { address });
          const result = await this.bridgeApi().perpsInit();
          if (!isCurrent()) {
            throw new Error('Perps account changed');
          }
          this.#viewActive = this.#viewActive || this.#accountViewActive;
          this.#accountViewActive = false;
          for (const [key, subscribe] of Object.entries(
            this.#dynamicSubscriptions,
          )) {
            if (!this.#dynamicUnsubs[key]) {
              this.#dynamicUnsubs[key] = subscribe();
            }
          }
          session.address = address.toLowerCase();
          session.needsTeardown = false;
          return result;
        } catch (error) {
          // A failed transition may have retired the provider. A cancelled UI
          // joining the same account must leave surviving owners connected.
          if (changesSharedSession) {
            session.address = undefined;
            session.needsTeardown = true;
          }
          throw error;
        }
      });
    session.queue = operation;
    return operation;
  }

  async #initAndActivate(): Promise<void> {
    if (!this.#isPreloadAllowed()) {
      throw new Error('Perps connection is unavailable');
    }
    const generation = this.#destroyGeneration;
    const session = this.#getAccountSession();
    // Stream remounts must neither interrupt account teardown nor be interrupted
    // by it. Keep the queue occupied until provider initialization settles.
    const operation = session.queue
      .catch(() => undefined)
      .then(async () => {
        if (
          generation !== this.#destroyGeneration ||
          !this.#isConnectionAlive() ||
          !this.#isPreloadAllowed()
        ) {
          return;
        }
        await this.#perpsInit();
        if (
          generation === this.#destroyGeneration &&
          !this.#activated &&
          this.#isConnectionAlive() &&
          this.#isPreloadAllowed()
        ) {
          this.#activate();
        }
      });
    session.queue = operation;
    await operation;
  }

  async #startPreload(id: string): Promise<void> {
    if (!this.#isPreloadAllowed() || !this.#isConnectionAlive()) {
      throw new Error('Perps preload is unavailable');
    }
    if (this.#preloadId === id) {
      return;
    }
    this.#releasePreload();
    this.#preloadId = id;
    const generation = this.#destroyGeneration;
    const { activeProvider, isTestnet } = this.#controller.state;
    const isCurrent = () =>
      this.#preloadId === id &&
      generation === this.#destroyGeneration &&
      this.#isConnectionAlive() &&
      this.#isPreloadAllowed() &&
      this.#controller.state.activeProvider === activeProvider &&
      this.#controller.state.isTestnet === isTestnet;
    try {
      await this.#initAndActivate();
      if (!isCurrent()) {
        throw new Error('Perps preload was released');
      }
      // Match Mobile's connection readiness check before prewarming prices.
      await this.#controller.getActiveProvider().ping();
      if (!isCurrent()) {
        throw new Error('Perps preload was released');
      }
      this.#preloadReady = true;
      this.#controller.startMarketDataPreload();
      const useTerminalApi = this.#isTerminalBackendEnabled();
      const markets = await this.#controller.getMarketDataWithPrices({
        useTerminalApi,
      });
      if (!isCurrent() || useTerminalApi !== this.#isTerminalBackendEnabled()) {
        throw new Error('Perps preload configuration changed');
      }
      if (markets.length === 0) {
        throw new Error('Perps preload returned no markets');
      }
      this.#emit('markets', markets, { live: true });
      this.#prewarmPrices(markets);
    } catch (error) {
      if (this.#preloadId === id) {
        this.#releasePreload();
        if (
          !this.#viewActive &&
          (!this.#walletInitialized || !this.#isPreloadAllowed())
        ) {
          this.destroy();
        }
      }
      throw error;
    }
  }

  #releasePreload(): void {
    this.#preloadId = null;
    if (this.#preloadPriceUnsubscribe) {
      this.#callAndClearUnsub(this.#preloadPriceUnsubscribe);
      this.#preloadPriceUnsubscribe = null;
    }
    this.#preloadSymbols = '';
    this.#preloadReady = false;
    // A global eligibility change applies to every UI. Otherwise the shared
    // controller retains its existing last-UI disconnect grace period.
    if (!this.#isPreloadAllowed()) {
      this.#controller.stopMarketDataPreload();
    }
  }

  #prewarmPrices(markets: PerpsMarketData[]): void {
    if (!this.#preloadId || !this.#preloadReady || !this.#isPreloadAllowed()) {
      return;
    }
    const symbols = Array.from(
      new Set(markets.map((market) => market.symbol)),
    ).sort((left, right) => left.localeCompare(right));
    const key = symbols.join('|');
    if (!key || key === this.#preloadSymbols) {
      return;
    }
    if (this.#preloadPriceUnsubscribe) {
      this.#callAndClearUnsub(this.#preloadPriceUnsubscribe);
      this.#preloadPriceUnsubscribe = null;
    }
    const id = this.#preloadId;
    this.#preloadPriceUnsubscribe = this.#controller.subscribeToPrices({
      symbols,
      includeMarketData: false,
      callback: (data) => {
        if (id === this.#preloadId) {
          // Focused activeAssetCtx prices take precedence over broad allMids,
          // regardless of callback order or a preload resubscription.
          const broadPrices = data.filter(
            (price) => !this.#foregroundPriceSymbols.has(price.symbol),
          );
          if (broadPrices.length > 0) {
            this.#emit('prices', broadPrices);
          }
        }
      },
    });
    this.#preloadSymbols = key;
  }

  /**
   * Runs a deferred dynamic-channel activation behind a per-channel generation
   * guard. If a `perpsDeactivate*Stream` for the same channel — or a full
   * `destroy()` — fires while `#initAndActivate()` is still pending, the
   * captured generation no longer matches on resume and the subscription is
   * skipped, so a quick open→close during cold init cannot leak a hidden
   * subscription created after teardown.
   *
   * @param channel - The dynamic channel being (re)activated.
   * @param activate - Subscribe callback, invoked only if still current.
   */
  async #activateDynamicWhenReady(
    channel: 'prices' | 'orderBook' | 'orderBookAggregated',
    activate: () => void,
  ): Promise<void> {
    const activationGenerationAtStart =
      this.#dynamicActivationGeneration[channel] ?? 0;
    const destroyGenerationAtStart = this.#destroyGeneration;

    await this.#initAndActivate();

    if (
      this.#destroyGeneration !== destroyGenerationAtStart ||
      (this.#dynamicActivationGeneration[channel] ?? 0) !==
        activationGenerationAtStart
    ) {
      return;
    }

    if (this.#isConnectionAlive()) {
      activate();
    }
  }

  /**
   * Tears down a dynamic channel and bumps its activation generation so any
   * activation that is still awaiting init for this channel aborts on resume
   * instead of resurrecting the subscription.
   *
   * @param channel - The dynamic channel to deactivate.
   */
  #deactivateDynamicChannel(
    channel: 'prices' | 'orderBook' | 'orderBookAggregated',
  ): void {
    delete this.#dynamicSubscriptions[channel];
    this.#dynamicActivationGeneration[channel] =
      (this.#dynamicActivationGeneration[channel] ?? 0) + 1;
    this.#tearDownChannel(channel);
  }

  #activate(): void {
    for (const unsub of this.#staticUnsubs) {
      this.#callAndClearUnsub(unsub);
    }
    this.#staticUnsubs.length = 0;

    this.#activated = true;
    this.#activatedAt = Date.now();
    const generation = this.#destroyGeneration;
    const emit: EmitFn = (channel, data, extra) => {
      if (generation === this.#destroyGeneration && this.#activated) {
        this.#emit(channel, data, extra);
      }
    };

    try {
      this.#staticUnsubs.push(
        this.#controller.subscribeToPositions({
          callback: (data: unknown) => emit('positions', data),
        }),
      );
      this.#staticUnsubs.push(
        this.#controller.subscribeToOrders({
          callback: (data: unknown) => emit('orders', data),
        }),
      );
      this.#staticUnsubs.push(
        this.#controller.subscribeToAccount({
          callback: (data: unknown) => emit('account', data),
        }),
      );
      this.#staticUnsubs.push(
        this.#controller.subscribeToOrderFills({
          callback: (data: unknown) => emit('fills', data),
        }),
      );

      this.#staticUnsubs.push(
        this.#controller.subscribeToConnectionState(
          (state: WebSocketConnectionState) => {
            this.#handleConnectionStateChange(state);
          },
        ),
      );

      this.#staticUnsubs.push(
        this.#onControllerStateChange(
          (state: PerpsControllerState, _patches: Patch[]) => {
            this.#handleMarketDataPreload(state);
          },
        ),
      );

      this.#staticUnsubs.push(
        this.#onConnectivityChange((state: { connectivityStatus: string }) => {
          this.#handleConnectivityChange(state.connectivityStatus);
        }),
      );
    } catch (error) {
      this.#activated = false;
      for (const unsub of this.#staticUnsubs) {
        this.#callAndClearUnsub(unsub);
      }
      this.#staticUnsubs.length = 0;
      throw error;
    }
  }

  #handleConnectionStateChange(state: WebSocketConnectionState): void {
    this.#emit('connectionState', { state });

    if (state === WebSocketConnectionState.Disconnected) {
      this.#wasDisconnected = true;
      return;
    }

    if (state === WebSocketConnectionState.Connected && this.#wasDisconnected) {
      this.#wasDisconnected = false;
      this.#hydrateAfterReconnect();
    }
  }

  /**
   * Triggers a health check when the device transitions from offline to online.
   * @param status
   */
  #handleConnectivityChange(status: string): void {
    const isOffline = status === 'offline';
    const wasOffline = this.#wasDeviceOffline;
    this.#wasDeviceOffline = isOffline;

    if (wasOffline && !isOffline) {
      const wsState = this.#controller.getWebSocketConnectionState();
      if (wsState === WebSocketConnectionState.Disconnected) {
        this.#controller.reconnect().catch((err) => {
          console.debug(
            '[PerpsStreamBridge] connectivity-change reconnect failed',
            err,
          );
        });
      }
    }
  }

  /**
   * Reacts to controller state changes by checking if the cached market data
   * has been updated (e.g. by the background preloader after HIP-3 config
   * arrives from LaunchDarkly). Pushes updated data to the UI via the
   * existing 'markets' channel so the stream manager stays in sync.
   *
   * Note that this is only supports a single provider (non aggregated), meaning that if we added another provider outside of hyperliquid, we'd need to update this cache
   * @param state
   */
  #handleMarketDataPreload(state: PerpsControllerState): void {
    const provider = state.activeProvider ?? 'hyperliquid';
    const isTestnet = state.isTestnet ?? false;
    const cacheKey = `${provider}:${isTestnet ? 'testnet' : 'mainnet'}`;
    const entry = state.cachedMarketDataByProvider?.[cacheKey];

    if (!entry?.data || entry.data.length === 0) {
      return;
    }

    const snapshotKey = `${cacheKey}:${entry.timestamp}`;
    if (snapshotKey === this.#lastMarketCacheKey) {
      return;
    }
    this.#lastMarketCacheKey = snapshotKey;

    // The controller's background preload (startMarketDataPreload) always
    // fetches via getMarketDataWithPrices({ standalone: true }) without the
    // Terminal API, so cachedMarketDataByProvider only ever holds
    // direct-provider data (no display names / keywords / tags / categories).
    // When the Terminal backend is enabled we must not warm the UI 'markets'
    // channel with that un-enriched snapshot. But the preload timestamp bump
    // still signals that the market set changed (e.g. a HIP-3 config arrived or
    // the 5-minute refresh ran), so re-fetch the enriched Terminal data and
    // emit that instead. Otherwise the channel would hold whatever the last
    // REST/reconnect hydration produced and silently go stale.
    if (this.#isTerminalBackendEnabled()) {
      this.#refetchTerminalMarketData();
      return;
    }

    this.#emit('markets', entry.data, {
      live: entry.timestamp >= this.#activatedAt,
    });
    this.#prewarmPrices(entry.data);
  }

  /**
   * Re-fetches enriched market data via the Terminal API and emits it on the
   * 'markets' channel. Used to keep Terminal-mode UI in sync when the
   * direct-provider preload cache updates (the raw snapshot is unfit to emit).
   *
   * Serialized via #terminalMarketRefetchInFlight; a bump that lands mid-fetch
   * flips #terminalMarketRefetchPending so exactly one follow-up fetch runs.
   * getMarketDataWithPrices with the Terminal API does not write
   * cachedMarketDataByProvider, so this cannot re-trigger the state listener.
   */
  #refetchTerminalMarketData(): void {
    // Re-check the flag on every entry (including the queued follow-up rerun):
    // the Terminal backend may have been disabled since the preload bump that
    // scheduled this refetch, and we must not issue/emit Terminal data once it
    // is off.
    if (!this.#isConnectionAlive() || !this.#isTerminalBackendEnabled()) {
      return;
    }
    if (this.#terminalMarketRefetchInFlight) {
      this.#terminalMarketRefetchPending = true;
      return;
    }
    this.#terminalMarketRefetchInFlight = true;
    const generationAtStart = this.#destroyGeneration;
    this.#controller
      .getMarketDataWithPrices({ useTerminalApi: true })
      .then((markets) => {
        // destroy() may have fired during the await; never emit onto a torn-down
        // stream. A generation bump (rather than a latched flag) lets later init
        // cycles resume refetching without an explicit reset. Also re-check the
        // flag: if the Terminal backend was disabled mid-flight, this enriched
        // payload no longer matches the active mode and must not be emitted.
        // Guard the empty case symmetrically with the direct-provider branch
        // in #handleMarketDataPreload: emitting an empty array would blank the
        // UI list and flip the channel's hasCachedData() to true, suppressing
        // the WS-grace REST fallback that would otherwise recover.
        if (
          this.#destroyGeneration === generationAtStart &&
          this.#isTerminalBackendEnabled() &&
          Array.isArray(markets) &&
          markets.length > 0
        ) {
          this.#emit('markets', markets, { live: true });
          this.#prewarmPrices(markets);
        }
      })
      .catch((error) => {
        console.debug(
          '[PerpsStreamBridge] terminal market data refetch failed',
          error,
        );
      })
      .finally(() => {
        // destroy() (and possibly a fresh init + refetch) may have fired during
        // the await. If so, this settled fetch belongs to a prior bridge
        // generation and must not touch the current generation's coordination
        // state: clearing #terminalMarketRefetchInFlight here could let an extra
        // concurrent Terminal REST call slip past the serializer, and clearing
        // #terminalMarketRefetchPending could drop a queued follow-up, delaying
        // the newest enriched market update until the next preload bump.
        if (this.#destroyGeneration !== generationAtStart) {
          return;
        }
        this.#terminalMarketRefetchInFlight = false;
        const shouldRerun = this.#terminalMarketRefetchPending;
        this.#terminalMarketRefetchPending = false;
        if (shouldRerun) {
          this.#refetchTerminalMarketData();
        }
      });
  }

  /**
   * Fetches fresh data via REST after a WebSocket reconnection so the UI
   * doesn't show stale values while waiting for the first stream push.
   * Market data is fetched first (highest UI priority), then user data
   * after a short stagger to reduce burst pressure on the rate limiter.
   */
  async #hydrateAfterReconnect(): Promise<void> {
    if (this.#isHydrating || !this.#isConnectionAlive()) {
      return;
    }
    this.#isHydrating = true;
    this.#hydrationSeq += 1;
    const hydrationToken = this.#hydrationSeq;

    try {
      const marketsResult = await this.#controller
        .getMarketDataWithPrices({
          useTerminalApi: this.#isTerminalBackendEnabled(),
        })
        .catch(() => null);

      if (hydrationToken !== this.#hydrationSeq || !this.#isConnectionAlive()) {
        return;
      }

      if (marketsResult) {
        this.#emit('markets', marketsResult, { live: true });
        this.#prewarmPrices(marketsResult);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, REST_HYDRATION_STAGGER_MS),
      );

      if (hydrationToken !== this.#hydrationSeq || !this.#isConnectionAlive()) {
        return;
      }

      const [positionsResult, ordersResult, accountResult] =
        await Promise.allSettled([
          this.#controller.getPositions({ skipCache: true }),
          this.#controller.getOpenOrders(),
          this.#controller.getAccountState(),
        ]);

      if (hydrationToken !== this.#hydrationSeq || !this.#isConnectionAlive()) {
        return;
      }

      if (positionsResult.status === 'fulfilled' && positionsResult.value) {
        this.#emit('positions', positionsResult.value);
      }
      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        this.#emit('orders', ordersResult.value);
      }
      if (accountResult.status === 'fulfilled') {
        this.#emit('account', accountResult.value ?? null);
      }
    } catch (err) {
      console.debug('[PerpsStreamBridge] post-reconnect hydration failed', err);
    } finally {
      if (hydrationToken === this.#hydrationSeq) {
        this.#isHydrating = false;
      }
    }
  }

  #activateStreaming(params: ActivateStreamingParams): void {
    const { priceSymbols, includeMarketData, orderBookSymbol, candle } = params;

    this.#tearDownAllDynamic();

    if (priceSymbols?.length) {
      this.#subscribeToPriceStream(priceSymbols, includeMarketData);
    }

    if (orderBookSymbol) {
      this.#addDynamicSubscription('orderBook', () =>
        this.#controller.subscribeToOrderBook({
          symbol: orderBookSymbol,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }

    if (candle?.symbol && candle?.interval) {
      const candleKey = this.#candleSubscriptionKey(
        candle.symbol,
        candle.interval,
      );
      this.#addDynamicSubscription(candleKey, () =>
        this.#controller.subscribeToCandles({
          ...candle,
          callback: (data: unknown) =>
            this.#emit('candles', data, {
              symbol: candle.symbol,
              interval: candle.interval,
            }),
        }),
      );
    }
  }

  #activatePriceStream(symbols: string[], includeMarketData?: boolean): void {
    this.#tearDownChannel('prices');
    if (symbols.length) {
      this.#subscribeToPriceStream(symbols, includeMarketData);
    }
  }

  #subscribeToPriceStream(
    symbols: string[],
    includeMarketData?: boolean,
  ): void {
    this.#addDynamicSubscription('prices', () => {
      const generation = this.#destroyGeneration;
      const activeSymbols = new Set(symbols);
      this.#foregroundPriceSymbols = activeSymbols;
      let unsubscribe: () => void;
      try {
        unsubscribe = this.#controller.subscribeToPrices({
          symbols,
          includeMarketData,
          callback: (data: unknown) => {
            if (
              generation === this.#destroyGeneration &&
              this.#foregroundPriceSymbols === activeSymbols
            ) {
              this.#emit('prices', data);
            }
          },
        });
      } catch (error) {
        this.#foregroundPriceSymbols = new Set();
        throw error;
      }
      return () => {
        this.#foregroundPriceSymbols = new Set();
        unsubscribe();
      };
    });
  }

  #activateOrderBookStream(params: {
    symbol: string;
    levels?: number;
    nSigFigs?: 2 | 3 | 4 | 5;
    mantissa?: 2 | 5;
  }): void {
    const { symbol } = params;
    this.#tearDownChannel('orderBook');
    if (symbol) {
      this.#addDynamicSubscription('orderBook', () =>
        this.#controller.subscribeToOrderBook({
          ...params,
          callback: (data: unknown) => this.#emit('orderBook', data),
        }),
      );
    }
  }

  /**
   * Activate the server-aggregated order-book subscription (`nSigFigs` /
   * `mantissa`) for the order-book panel's grouped ladder.
   *
   * Unlike the raw `orderBook` channel — which runs on the controller's shared
   * WebSocket — this runs on a dedicated Hyperliquid connection. The SDK routes
   * `l2Book` events by `coin` only, so a raw and an aggregated subscription for
   * the same coin on the same socket cross-contaminate (the coarse ladder and
   * the precise spread/slippage clobber each other). Isolating the aggregated
   * subscription on its own socket removes the collision: that socket carries a
   * single `l2Book` stream and the shared socket is never touched by grouping.
   *
   * @param params - Subscription parameters.
   * @param params.symbol - Market symbol.
   * @param params.levels - Number of levels per side to request.
   * @param params.nSigFigs - Server-side aggregation significant figures.
   * @param params.mantissa - Mantissa refinement when nSigFigs is 5.
   * @param params.subscriptionId - UI identity echoed on every emission.
   */
  #activateOrderBookAggregatedStream(params: {
    symbol: string;
    levels?: number;
    nSigFigs?: 2 | 3 | 4 | 5;
    mantissa?: 2 | 5;
    subscriptionId?: string;
  }): void {
    const { symbol, subscriptionId, levels, nSigFigs, mantissa } = params;
    this.#tearDownChannel('orderBookAggregated');
    if (symbol) {
      // Capture the UI identity in this subscription's closures so emissions
      // from a prior grouping keep their old id after the UI has already
      // switched — the StreamManager then discards the mismatch.
      const emitExtra =
        subscriptionId === undefined ? undefined : { subscriptionId };
      this.#addDynamicSubscription('orderBookAggregated', () =>
        this.#subscribeAggregatedOrderBook({
          symbol,
          levels,
          nSigFigs,
          mantissa,
          callback: (data: unknown) =>
            this.#emit('orderBookAggregated', data, emitExtra),
          onStatusChange: (status) =>
            this.#emit('orderBookAggregatedStatus', status, emitExtra),
        }),
      );
    }
  }

  #activateCandleStream(params: {
    symbol: string;
    interval: CandlePeriod;
    duration?: TimeDuration;
  }): void {
    if (!params.symbol || !params.interval) {
      return;
    }
    const key = this.#candleSubscriptionKey(params.symbol, params.interval);
    this.#addDynamicSubscription(key, () =>
      this.#controller.subscribeToCandles({
        ...params,
        callback: (data: unknown) =>
          this.#emit('candles', data, {
            symbol: params.symbol,
            interval: params.interval,
          }),
      }),
    );
  }

  #candleSubscriptionKey(symbol: string, interval: CandlePeriod): string {
    return `candles:${symbol}:${interval}`;
  }

  #tearDownDynamicKey(key: string): void {
    const unsub = this.#dynamicUnsubs[key];
    if (unsub) {
      this.#callAndClearUnsub(unsub);
      delete this.#dynamicUnsubs[key];
    }
  }

  #callAndClearUnsub(unsub: () => void): void {
    try {
      unsub();
    } catch (error) {
      console.debug('[PerpsStreamBridge] cleanup error', error);
    }
  }

  #tearDownAllDynamic(): void {
    for (const handle of this.#pendingCandleTeardowns.values()) {
      clearTimeout(handle);
    }
    this.#pendingCandleTeardowns.clear();
    // In-flight activations cannot be aborted, but dropping the map means the
    // next perpsActivateCandleStream after teardown issues a fresh activation
    // instead of awaiting an obsolete promise from the pre-teardown session.
    this.#pendingCandleActivations.clear();

    for (const unsub of Object.values(this.#dynamicUnsubs)) {
      this.#callAndClearUnsub(unsub);
    }
    for (const key of Object.keys(this.#dynamicUnsubs)) {
      delete this.#dynamicUnsubs[key];
    }
  }

  #tearDownChannel(
    channel: 'prices' | 'orderBook' | 'orderBookAggregated',
  ): void {
    const unsub = this.#dynamicUnsubs[channel];
    if (unsub) {
      this.#callAndClearUnsub(unsub);
      delete this.#dynamicUnsubs[channel];
    }
  }

  #addDynamicSubscription(key: string, subscribe: () => () => void): void {
    this.#tearDownDynamicKey(key);
    this.#dynamicSubscriptions[key] = subscribe;
    this.#dynamicUnsubs[key] = subscribe();
  }
}
