/**
 * Console reporter rules for jest-clean-console-reporter (Integration Tests)
 *
 * Generated from analysis of ALL integration tests (21 test suites, 82 tests)
 * - console.warn: ~420 warnings
 * - console.error: ~15 errors
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
  // RESELECT WARNINGS (Redux Selector Performance)
  // ===========================================================================
  // Most common in integration tests: 230 occurrences

  {
    match: /The result function returned its own inputs without modification/u,
    group: 'Reselect: Identity function warnings',
  },

  // Second most common: 168 occurrences
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
  // METAMASK-SPECIFIC WARNINGS
  // ===========================================================================

  // Theme warnings: 19 occurrences
  {
    match: /useTheme: Invalid theme resolved to/u,
    group: 'MetaMask: Invalid theme warnings',
  },

  {
    match: /Background connection is not set/u,
    group: 'MetaMask: Background connection not initialized',
  },

  {
    match: /NO_BACKGROUND_CONNECTION_MESSAGE/u,
    group: 'MetaMask: Background connection not initialized',
  },

  // ===========================================================================
  // REACT WARNINGS
  // ===========================================================================

  // Act warnings: ~4 occurrences
  {
    match:
      /Warning: An update to .* inside a test was not wrapped in act\(\.\.\.\)/u,
    group: 'React: Act warnings (component updates not wrapped)',
  },

  // Lifecycle deprecations: 1 occurrence
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

  // DOM nesting violations: 3 occurrences
  {
    match: /Warning: validateDOMNesting\(\.\.\.\)/u,
    group: 'React: DOM nesting violations',
  },

  // Failed prop types: 4 occurrences
  {
    match: /Warning: Failed prop type/u,
    group: 'React: PropTypes validation failures',
  },

  // State updates on unmounted components: 2 occurrences
  {
    match:
      /Warning: Can't perform a React state update on an unmounted component/u,
    group: 'React: State updates on unmounted components',
  },

  {
    match: /Warning: Cannot update a component/u,
    group: 'React: Component update warnings',
  },

  // Missing keys
  {
    match: /Warning: Each child in a list should have a unique "key" prop/u,
    group: 'React: Missing key props in lists',
  },

  // ===========================================================================
  // REACT ROUTER WARNINGS
  // ===========================================================================
  // 2 occurrences

  {
    match: /Warning: Hash history cannot PUSH the same path/u,
    group: 'React Router: Duplicate navigation warnings',
  },

  // ===========================================================================
  // INTEGRATION-SPECIFIC PATTERNS
  // ===========================================================================

  {
    match: /Network request failed/u,
    group: 'Integration: Network request failures',
  },

  {
    match: /API.*error/iu,
    group: 'Integration: API errors',
  },

  {
    match: /Connection.*timeout/iu,
    group: 'Integration: Connection timeouts',
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
  // OPTIONAL: SUPPRESS SPECIFIC PATTERNS
  // ===========================================================================

  // Uncomment to completely suppress specific warnings:
  // {
  //   match: (_message, level) => level === 'log',
  //   group: null,
  // },
];
