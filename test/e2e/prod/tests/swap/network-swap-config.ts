/**
 * Network configuration for swap quotation tests
 *
 * Defines which networks support swap testing and tokens to import
 */

/**
 * Network configuration for swap tests
 */
export interface NetworkSwapConfig {
  /** Unique identifier for the network */
  networkId: string;
  /** Display name of the network */
  networkName: string;
  /** Chain ID (decimal number) */
  chainId: number;
  /** Native token symbol (e.g., MON, ETH) */
  nativeTokenSymbol: string;
  /** URL to the tokenlist JSON file */
  tokenlistUrl: string;
  /** Optional: Fixture setup method name from FixtureBuilder */
  fixtureSetupMethod?: string;
  /** Optional: Block explorer URL */
  blockExplorerUrl?: string;
  /** Optional: ERC-20 token symbols to resolve from tokenlist for execution tests */
  swapExecutionTokenSymbols?: string[];
  /** Optional: Ordered swap routes for execution tests */
  swapExecutionRoutes?: Array<{ from: string; to: string }>;
}

/**
 * Token object structure (matching standard tokenlist format)
 */
export interface Token {
  chainId: number | string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  logoUri?: string;
}

/**
 * Swap quotation snapshot (values captured before/after token switch)
 */
export interface QuotationSnapshot {
  fromAmount: string;
  toAmount: string;
  networkFeeSponsored: string;
  slippageValue: string;
  priceImpact: string;
  minimumReceived: string;
  capturedAt: string;
}

/**
 * Token pair quotations for comparison
 */
export interface TokenPairQuotations {
  sourceToken: Token;
  destinationToken: Token;
  beforeSwitch: QuotationSnapshot;
  afterSwitch: QuotationSnapshot;
  assertion: {
    expectedTokensSwitch: boolean;
    valuesChanged: boolean;
  };
}

/**
 * Result of a single token-pair test
 */
export interface QuotationTestResult {
  networkName: string;
  tokenPair: string;
  sourceTokenSymbol: string;
  destinationTokenSymbol: string;
  quotations: TokenPairQuotations;
  status: 'passed' | 'failed';
  error?: string;
}

/**
 * Result of a single swap execution route
 */
export interface SwapRouteResult {
  /** Route label e.g. "MON → AUSD" */
  route: string;
  fromSymbol: string;
  toSymbol: string;
  /** Source amount captured from the swap UI before submission */
  fromAmount: string;
  /** Destination amount captured from the swap UI before submission */
  toAmount: string;
  status: 'passed' | 'failed';
  error?: string;
}

/**
 * Consolidated report for a swap execution test run
 */
export interface SwapExecutionReport {
  networkName: string;
  chainId: number;
  timestamp: string;
  totalRoutes: number;
  passedRoutes: number;
  failedRoutes: number;
  routeResults: SwapRouteResult[];
}

/**
 * Consolidated test results for report generation
 */
export interface ConsolidatedTestResults {
  networkName: string;
  chainId: number;
  tokenlistUrl: string;
  nativeTokenSymbol: string;
  timestamp: string;
  tokensImported: number;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  testResults: QuotationTestResult[];
}

/**
 * Number of tokens to import from tokenlist
 */
export const TOKENS_TO_IMPORT = 3;

/**
 * Default from amount for swap tests
 */
export const DEFAULT_SWAP_AMOUNT = 20;

/**
 * Network configurations for swap quotation tests
 * Add new networks here to support them in tests
 */
export const SWAP_TEST_NETWORKS: NetworkSwapConfig[] = [
  {
    networkId: 'Mon',
    networkName: 'Monad',
    chainId: 143,
    nativeTokenSymbol: 'MON',
    tokenlistUrl:
      'https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/tokenlist-mainnet.json',
    fixtureSetupMethod: 'withNetworkControllerOnMonad',
    blockExplorerUrl: 'https://explorer.monad.xyz',
    swapExecutionTokenSymbols: ['AUSD', 'AZND', 'BTC.b'],
    swapExecutionRoutes: [
      { from: 'MON', to: 'AUSD' },
      { from: 'AUSD', to: 'AZND' },
      { from: 'AZND', to: 'BTC.b' },
      { from: 'BTC.b', to: 'MON' },
    ],
  },
  // Add more networks here as needed
  // Example for future network:
  // {
  //   networkId: 'Base',
  //   networkName: 'Base',
  //   chainId: 8453,
  //   nativeTokenSymbol: 'ETH',
  //   tokenlistUrl: 'https://example.com/tokenlist.json',
  //   fixtureSetupMethod: 'withNetworkControllerOnBase',
  // },
];

/**
 * Get network config by network ID
 * @param networkId - The unique identifier for the network
 * @returns The network configuration or undefined if not found
 */
export function getNetworkSwapConfig(
  networkId: string,
): NetworkSwapConfig | undefined {
  return SWAP_TEST_NETWORKS.find((config) => config.networkId === networkId);
}

/**
 * Get all network IDs for swap tests
 * @returns Array of all network IDs that support swap testing
 */
export function getAllSwapTestNetworkIds(): string[] {
  return SWAP_TEST_NETWORKS.map((config) => config.networkId);
}

/**
 * Validate that a network config has all required fields for swap testing
 * @param config - The network configuration to validate
 * @throws Error if validation fails
 */
export function validateNetworkSwapConfig(config: NetworkSwapConfig): void {
  if (!config.networkId) {
    throw new Error('Network config missing required field: networkId');
  }
  if (!config.networkName) {
    throw new Error('Network config missing required field: networkName');
  }
  if (typeof config.chainId !== 'number') {
    throw new Error('Network config missing required field: chainId');
  }
  if (!config.nativeTokenSymbol) {
    throw new Error('Network config missing required field: nativeTokenSymbol');
  }
  if (!config.tokenlistUrl) {
    throw new Error('Network config missing required field: tokenlistUrl');
  }
}
