/**
 * provider-engine (extension-specific)
 *
 * Builds the JSON-RPC middleware pipeline for EIP-1193 and CAIP Multichain
 * provider connections. Each inbound dapp or snap connection gets its own
 * JsonRpcEngine instance assembled here.
 *
 * WHY EXTENSION-SPECIFIC: The middleware ordering is extension-specific.
 * It embeds PPOM phishing detection, MetaMetrics tracking, legacy eth_
 * method shims, EVM-to-non-EVM filtering, Defi referral tracking, and
 * onboarding hooks — none of which exist in the mobile middleware pipeline.
 * Mobile uses a separate provider stack (EthQuery + WalletConnect transport).
 *
 * WHY A CLASS: ProviderEngineFactory holds references to controller instances
 * that were injected at construction time. Like ConnectionManager, statefulness
 * comes from the injected controllers, not from the factory itself — but a
 * class gives callers a stable factory API and makes the dependency list
 * explicit and testable.
 *
 * Extracted from MetamaskController (~710 lines across 3 methods):
 *   setupProviderEngineEip1193  (L6713–7199, ~487 lines)
 *   setupProviderEngineCaip     (L7210–7433, ~224 lines)
 *   setupCommonMiddlewareHooks  (L6601–6712, ~112 lines, shared between both)
 *
 * Connection wiring (setupProviderConnectionEip1193, setupProviderConnectionCaip,
 * setupUntrustedCommunication*, setupTrustedCommunication) lives in
 * ConnectionManager — the two modules are layered: ProviderEngineFactory
 * builds an engine, ConnectionManager pipes a port stream through it.
 */

import type { RootMessenger } from '../messenger';

// ---------------------------------------------------------------------------
// Dependency types
// ---------------------------------------------------------------------------

/**
 * Subset of controller instances required to assemble the middleware pipeline.
 * These are injected at construction so the factory can build engines without
 * holding a reference to MetamaskController itself.
 *
 * TODO: Replace controller instance references with messenger actions once
 * the UI Messenger ADR (#117) is adopted. Each `this.fooController.method()`
 * becomes `messenger.call('FooController:method', ...)`.
 */
export type ProviderEngineDependencies = {
  messenger: RootMessenger;
  // Controller instances still needed until their methods are exposed as
  // messenger actions. Kept typed as `unknown` here to avoid circular
  // imports — callers cast to the real types at the injection site.
  permissionController: unknown;
  networkController: unknown;
  appStateController: unknown;
  preferencesController: unknown;
  phishingController: unknown;
  ppomController: unknown;
  metaMetricsController: unknown;
  accountsController: unknown;
  onboardingController: unknown;
  subjectMetadataController: unknown;
  selectedNetworkController: unknown;
  permissionLogController: unknown;
  multichainRouter: unknown;
};

// ---------------------------------------------------------------------------
// ProviderEngineFactory
// ---------------------------------------------------------------------------

/**
 * Assembles JsonRpcEngine instances for dapp/snap connections.
 *
 * Usage:
 *   const factory = new ProviderEngineFactory(deps);
 *   const engine = factory.buildEip1193Engine({ origin, sender, subjectType, tabId, mainFrameOrigin });
 */
export class ProviderEngineFactory {
  readonly #messenger: RootMessenger;

  readonly #permissionController: unknown;

  readonly #networkController: unknown;

  readonly #appStateController: unknown;

  readonly #preferencesController: unknown;

  readonly #selectedNetworkController: unknown;

  readonly #permissionLogController: unknown;

  constructor(deps: ProviderEngineDependencies) {
    this.#messenger = deps.messenger;
    this.#permissionController = deps.permissionController;
    this.#networkController = deps.networkController;
    this.#appStateController = deps.appStateController;
    this.#preferencesController = deps.preferencesController;
    this.#selectedNetworkController = deps.selectedNetworkController;
    this.#permissionLogController = deps.permissionLogController;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Builds a JsonRpcEngine for an EIP-1193 (legacy/single-chain) connection.
   *
   * Middleware stack (innermost → outermost, i.e. first applied):
   *   1. createOriginMiddleware              — stamps `origin` on every request
   *   2. createMainFrameOriginMiddleware     — stamps iframe top-frame origin
   *   3. createSelectedNetworkMiddleware     — resolves per-origin networkClientId
   *   4. createTabIdMiddleware               — stamps tabId on requests (tabs only)
   *   5. createLoggerMiddleware              — dev/debug logging
   *   6. permissionLogController middleware  — audit log for permission events
   *   7. createTracingMiddleware             — perf tracing
   *   8. createOriginThrottlingMiddleware    — rate-limit noisy origins
   *   9. eip7715BlockingMiddleware           — blocks wallet_requestExecutionPermissions
   *  10. createPPOMMiddleware                — phishing/security alert injection
   *  11. createDappSwapMiddleware            — native swap suggestions
   *  12. createTrustSignalsMiddleware        — origin trust score overlay
   *  13. createRPCMethodTrackingMiddleware   — MetaMetrics per-method tracking
   *  14. createUnsupportedMethodMiddleware   — 405 for unsupported methods
   *  15. createPreinstalledSnapsMiddleware   — preinstalled snap eth_ handlers
   *  16. createWalletSnapPermissionMiddleware — snap-specific permission gate
   *  17. createEthAccountsMethodMiddleware   — eth_accounts passthrough
   *  18. permissionController middleware     — full CAIP-25 permission check
   *  19. createDefiReferralMiddleware        — Defi partner attribution
   *  20. createOnboardingMiddleware          — onboarding flow hook (websites only)
   *  21. createEvmMethodsToNonEvmAccountReqFilterMiddleware — non-EVM guard
   *  22. createEip1193MethodMiddleware       — unrestricted RPC implementations
   *  23. filterMiddleware                    — eth_getFilterChanges / eth_newFilter
   *  24. subscriptionManager.middleware      — eth_subscribe / eth_unsubscribe
   *  25. metamaskMiddleware                  — MetaMask-specific extensions
   *  26. eip5792Middleware                   — wallet_sendCalls / wallet_getCallsStatus
   *  27. eip7702Middleware                   — account upgrade (preinstalled snaps only)
   *  28. providerAsMiddleware(proxyClient)   — final network dispatch
   *
   * Extracted from MetamaskController.setupProviderEngineEip1193 (L6713–7199).
   *
   * TODO: Replace controller instance references with messenger actions.
   * TODO: Requires engine construction helpers to be importable outside MC.
   */
  buildEip1193Engine(options: {
    origin: string;
    subjectType: string;
    sender: unknown;
    tabId?: number;
    mainFrameOrigin?: string;
  }): unknown {
    // TODO: Implement full middleware pipeline.
    // The MC implementation (L6713–7199) is ~487 lines of middleware push() calls.
    // Each push() that references `this.fooController` becomes a dependency
    // injected via the constructor above.
    //
    // Blocked on:
    //   - Middleware constructors (createPPOMMiddleware, createRPCMethodTrackingMiddleware,
    //     createEip1193MethodMiddleware, etc.) need to be importable without
    //     MetamaskController context.
    //   - Controller instances need to be replaced with messenger actions
    //     (tracked in MetaMask/decisions#117, MetaMask/decisions#137).
    //
    // PoC note: This stub demonstrates WHERE the logic moves — not that it's
    // fully implemented yet. The important result is that MC no longer owns
    // engine construction after this extraction.
    void options;
    void this.#messenger;
    void this.#permissionController;
    void this.#networkController;
    void this.#appStateController;
    void this.#preferencesController;
    void this.#selectedNetworkController;
    void this.#permissionLogController;
    throw new Error(
      'ProviderEngineFactory.buildEip1193Engine: not yet fully extracted — see TODO above',
    );
  }

  /**
   * Builds a JsonRpcEngine for a CAIP Multichain provider connection.
   *
   * Middleware stack (key layers):
   *   1. createOriginMiddleware
   *   2. createTabIdMiddleware
   *   3. createRPCMethodTrackingMiddleware (CAIP variant)
   *   4. createUnsupportedMethodMiddleware
   *   5. multichainApiPermissionMiddleware (CAIP-25 caveat check)
   *   6. createMultichainMethodMiddleware  (wallet_*, non-EVM dispatch)
   *   7. filterMiddleware + subscriptionManager.middleware
   *   8. providerAsMiddleware(proxyClient)
   *
   * Extracted from MetamaskController.setupProviderEngineCaip (L7210–7433).
   *
   * TODO: Same blockers as buildEip1193Engine above.
   */
  buildCaipEngine(options: {
    origin: string;
    sender: unknown;
    subjectType: string;
    tabId?: number;
  }): unknown {
    void options;
    throw new Error(
      'ProviderEngineFactory.buildCaipEngine: not yet fully extracted — see TODO above',
    );
  }

  /**
   * Returns middleware hooks shared between EIP-1193 and CAIP engines.
   *
   * Hooks include: getProviderState, handleWatchAssetRequest, requestUserApproval,
   * getCaveat, getNonEvmSupportedMethods, etc.
   *
   * Extracted from MetamaskController.setupCommonMiddlewareHooks (L6601–6712).
   *
   * TODO: Each hook that calls `this.fooController` becomes a messenger call.
   */
  buildCommonHooks(origin: string): Record<string, unknown> {
    void origin;
    return {};
  }
}
