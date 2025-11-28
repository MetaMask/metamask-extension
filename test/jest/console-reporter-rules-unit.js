/**
 * Console reporter rules for jest-clean-console-reporter (Unit Tests)
 *
 * Generated from analysis of ALL unit tests (1582 test suites, 13176 tests)
 * - Total console.warn: 4849
 * - Total console.error: 1450
 *
 * Rules are matched in order from top to bottom.
 * See: https://github.com/jevakallio/jest-clean-console-reporter
 *
 * Each rule has:
 * - match: RegExp, string, or function to match console messages
 * - group: string to group similar messages, or null to ignore completely
 * - keep: (optional) true to also keep in raw output
 */

module.exports = [
  // ===========================================================================
  // METAMASK-SPECIFIC WARNINGS
  // ===========================================================================
  // Most frequent warning in test suite: 2300 occurrences

  {
    match: /Background connection is not set/u,
    group: 'MetaMask: Background connection not initialized',
  },

  {
    match: /NO_BACKGROUND_CONNECTION_MESSAGE/u,
    group: 'MetaMask: Background connection not initialized',
  },

  // Theme warnings: 700+ occurrences
  {
    match: /useTheme: Invalid theme resolved to/u,
    group: 'MetaMask: Invalid theme warnings',
  },

  // Migration warnings
  {
    match: /newState\.\w+ is not present/u,
    group: 'MetaMask: Migration state warnings',
  },

  {
    match: /Skipping migration/u,
    group: 'MetaMask: Migration skipped warnings',
  },

  // Asset/Token warnings
  {
    match: /Could not find balance(s)? for (asset|account)/u,
    group: 'MetaMask: Balance not found warnings',
  },

  {
    match: /Token metadata not found for address/u,
    group: 'MetaMask: Token metadata warnings',
  },

  // Network/Chain warnings
  {
    match: /Failed to fetch the chainId from the endpoint/u,
    group: 'MetaMask: Chain fetch failures',
  },

  {
    match: /Chain processing failed/u,
    group: 'MetaMask: Chain processing errors',
  },

  {
    match: /No XChain Swaps native asset found for chainId/u,
    group: 'MetaMask: XChain Swaps warnings',
  },

  // MetaMetrics warnings
  {
    match: /MetaMetricsController:.*value is not a valid trait type/u,
    group: 'MetaMask: MetaMetrics invalid trait types',
  },

  // RPC/Middleware warnings
  {
    match: /createRPCMethodTrackingMiddleware: Errored/u,
    group: 'MetaMask: RPC middleware errors',
  },

  // Service warnings
  {
    match: /\[BackendWebSocketService\]/u,
    group: 'MetaMask: Backend WebSocket warnings',
  },

  {
    match: /Sentry not initialized/u,
    group: 'MetaMask: Sentry initialization warnings',
  },

  // Instance warnings
  {
    match: /You have multiple instances of MetaMask running/u,
    group: 'MetaMask: Multiple instances warning',
  },

  // Permission warnings
  {
    match: /Unknown aggregated permission type/u,
    group: 'MetaMask: Permission type warnings',
  },

  // ===========================================================================
  // RESELECT WARNINGS (Redux Selector Performance)
  // ===========================================================================
  // Second most frequent: 1163 occurrences

  {
    match: /The result function returned its own inputs without modification/u,
    group: 'Reselect: Identity function warnings',
  },

  // Third most frequent: 533 occurrences
  {
    match:
      /An input selector returned a different result when passed same arguments/u,
    group: 'Reselect: Input stability warnings',
  },

  {
    match:
      /Your result function returned a different result when passed same arguments/u,
    group: 'Reselect: Output stability warnings',
  },

  // ===========================================================================
  // REACT ACT WARNINGS (Testing Library)
  // ===========================================================================
  // Very common - hundreds of occurrences across different components

  {
    match:
      /Warning: An update to .* inside a test was not wrapped in act\(\.\.\.\)/u,
    group: 'React: Act warnings (component updates not wrapped)',
  },

  {
    match:
      /Warning: Do not await the result of calling act\(\.\.\.\) with sync logic/u,
    group: 'React: Act usage warnings (incorrect await)',
  },

  // ===========================================================================
  // REACT WARNINGS
  // ===========================================================================

  // Lifecycle deprecations: 19 occurrences
  {
    match: /Warning: componentWillReceiveProps has been renamed/u,
    group: 'React: componentWill* lifecycle deprecations',
  },

  {
    match: /Warning: componentWillMount has been renamed/u,
    group: 'React: componentWill* lifecycle deprecations',
  },

  {
    match: /Warning: componentWillUpdate has been renamed/u,
    group: 'React: componentWill* lifecycle deprecations',
  },

  // DOM nesting violations: 21 occurrences
  {
    match: /Warning: validateDOMNesting\(\.\.\.\)/u,
    group: 'React: DOM nesting violations',
  },

  // Missing keys: 20 occurrences
  {
    match: /Warning: Each child in a list should have a unique "key" prop/u,
    group: 'React: Missing key props in lists',
  },

  // Failed prop types: 11+ occurrences
  {
    match: /Warning: Failed prop type/u,
    group: 'React: PropTypes validation failures',
  },

  // State update warnings
  {
    match:
      /Warning: Can't perform a React state update on an unmounted component/u,
    group: 'React: State updates on unmounted components',
  },

  {
    match: /Warning: Cannot update a component/u,
    group: 'React: Component update warnings',
  },

  // Hooks violations: 6 occurrences
  {
    match:
      /Warning: Do not call Hooks inside useEffect\(\.\.\.\), useMemo\(\.\.\.\), or other built-in Hooks/u,
    group: 'React: Rules of Hooks violations',
  },

  // ===========================================================================
  // REACT ROUTER WARNINGS
  // ===========================================================================

  {
    match: /Warning: Hash history cannot PUSH the same path/u,
    group: 'React Router: Duplicate navigation warnings',
  },

  // ===========================================================================
  // THIRD-PARTY LIBRARY WARNINGS
  // ===========================================================================

  // Material UI / JSS
  {
    match: /Warning: \[JSS\]/u,
    group: 'Material-UI: JSS warnings',
  },

  // µWS (WebSocket library)
  {
    match: /This version of µWS is not compatible with your Node\.js build/u,
    group: 'µWebSockets: Compatibility warnings',
  },

  {
    match:
      /Falling back to a NodeJS implementation; performance may be degraded/u,
    group: 'µWebSockets: Fallback to Node implementation',
  },

  // Bindings
  {
    match: /bigint: Failed to load bindings, pure JS will be used/u,
    group: 'Third-party: Bindings failed, using pure JS',
  },

  // ObjectMultiplex
  {
    match: /ObjectMultiplex - malformed chunk without name/u,
    group: 'ObjectMultiplex: Malformed chunk warnings',
  },

  // ===========================================================================
  // UNCAUGHT ERRORS IN TESTS
  // ===========================================================================

  {
    match: /Error: Uncaught \[TypeError/u,
    group: 'Test errors: Uncaught TypeErrors',
  },

  {
    match: /Error: Uncaught \[Error/u,
    group: 'Test errors: Uncaught Errors',
  },

  {
    match: /FetchError \{/u,
    group: 'Test errors: Fetch failures',
  },

  // ===========================================================================
  // TESTING LIBRARY WARNINGS
  // ===========================================================================

  {
    match: /Unable to find an element/u,
    group: 'Testing Library: Element not found warnings',
  },

  // ===========================================================================
  // DEPRECATION WARNINGS
  // ===========================================================================

  {
    match: /DeprecationWarning/u,
    group: 'Deprecation warnings',
  },

  {
    match: /is deprecated and will be removed/u,
    group: 'Deprecation warnings',
  },

  // ===========================================================================
  // REACT ROUTER WARNINGS
  // ===========================================================================

  {
    match: /Warning: Hash history cannot PUSH the same path/u,
    group: 'React Router: Duplicate navigation warnings',
  },

  // ===========================================================================
  // OPTIONAL: SUPPRESS SPECIFIC PATTERNS
  // ===========================================================================
  // Uncomment to completely suppress specific warnings

  // Suppress all console.log (uncomment if too noisy):
  // {
  //   match: (_message, level) => level === 'log',
  //   group: null,
  // },
];
