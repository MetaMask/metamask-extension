/**
 * Network configuration for swap quotation tests
 *
 * Defines which networks support swap testing and tokens to import
 */

/**
 * Network configuration for swap tests
 */
export type NetworkSwapConfig = {
  /** Unique identifier for the network */
  networkId: string;
  /** Display name of the network */
  networkName: string;
  /** Chain ID (decimal number) */
  chainId: number;
  /** Native token symbol (e.g., MON, ETH) */
  nativeTokenSymbol: string;
  /**
   * URL to the tokenlist JSON file. Required when `manualTokens` is not provided.
   * Mutually exclusive with `manualTokens`.
   */
  tokenlistUrl?: string;
  rpcUrl?: string;
  rpcName?: string;
  /**
   * Manually specified tokens to import instead of fetching from `tokenlistUrl`.
   * Use for networks without a public tokenlist or when exact contract addresses
   * are required. Mutually exclusive with `tokenlistUrl`.
   */
  manualTokens?: ManualToken[];
  /** Fixture setup method name from FixtureBuilder */
  fixtureSetupMethod: string;
  /** Optional: Block explorer URL */
  blockExplorerUrl?: string;
  /** Optional: ERC-20 token symbols to resolve from tokenlist for execution tests */
  swapExecutionTokenSymbols?: string[];
  /** Optional: Ordered swap routes for execution tests */
  swapExecutionRoutes?: SwapExecutionRoute[];
  /**
   * Legacy default source amount for routes that do not define `amount`.
   * Prefer route-level `amount` in `swapExecutionRoutes` for precise control.
   */
  defaultSwapAmount?: number;
  /**
   * When true, the ""Total gas fee"" row on the swap detail page is expected to
   * show ""Paid by MetaMask"" (green badge). Set for networks where MetaMask
   * sponsors gas (e.g. Monad, SEI). Defaults to false.
   */
  gasFeeSponsoredByProtocol?: boolean;
  /**
   * When true, this is a custom network requiring manual RPC setup during test.
   * Custom networks are added via the UI (SelectNetwork → AddCustomNetworkModal → RpcUrlModal).
   * Defaults to false.
   */
  requiresManualSetup?: boolean;
}

/**
 * A manually specified token for import — used when a network does not have a
 * public tokenlist URL or when exact contract addresses are required.
 */
export type ManualToken = {
  /** Token symbol as it appears in MetaMask (e.g. 'USDC') */
  symbol: string;
  /** ERC-20 contract address on the network */
  address: string;
  /** Optional display name; defaults to symbol when omitted */
  name?: string;
  /** Token decimal precision; defaults to 18 when omitted */
  decimals?: number;
};

/**
 * Ordered swap route definition for execution tests.
 */
export type SwapExecutionRoute = {
  /** Source token symbol for the route */
  from: string;
  /** Destination token symbol for the route */
  to: string;
  /**
   * Source amount to enter for this route.
   * Ignored when `useMax` is true.
   */
  amount?: string | number;
  /**
   * When true, click Max instead of filling amount input.
   */
  useMax?: boolean;
};

/**
 * Token object structure (matching standard tokenlist format)
 */
export type Token = {
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
export type QuotationSnapshot = {
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
export type TokenPairQuotations = {
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
export type QuotationTestResult = {
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
export type SwapRouteResult = {
  /** Route label e.g. ""MON → AUSD"" */
  route: string;
  fromSymbol: string;
  toSymbol: string;
  /** Source amount captured from the swap UI before submission */
  fromAmount: string;
  /** Destination amount captured from the swap UI before submission */
  toAmount: string;
  /** Per-check validation results captured while executing this route */
  validations?: SwapValidationResult[];
  status: 'passed' | 'warning' | 'failed';
  error?: string;
}

/**
 * Result of an individual validation check within a swap route.
 */
export type SwapValidationResult = {
  /** Human-readable validation name */
  name: string;
  /** Whether the validation passed, failed, or only warned */
  status: 'passed' | 'failed' | 'warning';
  /** Optional diagnostic details (actual value, warning text, etc.) */
  details?: string;
}

/**
 * Consolidated report for a swap execution test run
 */
export type SwapExecutionReport = {
  networkName: string;
  chainId: number;
  timestamp: string;
  totalRoutes: number;
  passedRoutes: number;
  warningRoutes: number;
  failedRoutes: number;
  routeResults: SwapRouteResult[];
}

/**
 * Consolidated test results for report generation
 */
export type ConsolidatedTestResults = {
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
   //  Additional  network list
  {
    networkId: 'Mon',
    networkName: 'Monad',
    chainId: 143,
    nativeTokenSymbol: 'MON',
    tokenlistUrl:
      'https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/tokenlist-mainnet.json',
    fixtureSetupMethod: 'withNetworkControllerOnMonad',
    blockExplorerUrl: 'https://explorer.monad.xyz',
    swapExecutionTokenSymbols: ['USDC', 'AZND'],
    swapExecutionRoutes: [
      { from: 'MON', to: 'USDC', amount: 10 },
      { from: 'USDC', to: 'AZND', amount: 0.23 },
      { from: 'AZND', to: 'MON', useMax: true },
    ],
    defaultSwapAmount: 20,
    gasFeeSponsoredByProtocol: true,
  },
  // Add more networks here as needed.
  //  Popular network list
  {
    networkId: 'Base',
    networkName: 'Base',
    chainId: 8453,
    nativeTokenSymbol: 'ETH',
    manualTokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        decimals: 6,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
      },
    ],
    fixtureSetupMethod: 'withNetworkControllerOnBase',
    blockExplorerUrl: 'https://basescan.org',
    swapExecutionTokenSymbols: ['USDC', 'WETH'],
    defaultSwapAmount: 0.0000001,
    swapExecutionRoutes: [
      { from: 'ETH', to: 'USDC', amount: '0.0000001' },
      { from: 'USDC', to: 'WETH', amount: 0.01 },
      { from: 'WETH', to: 'ETH', useMax: true },
    ],
  },
  // Custom network list
  // {
  //   networkId: 'Chiliz',
  //   networkName: 'Chiliz Chain',
  //   chainId: 88888,
  //   nativeTokenSymbol: 'CHZ',
  //   rpcUrl: 'https://rpc.ankr.com/chiliz',
  //   rpcName: 'Chiliz RPC',
  //   tokenlistUrl:
  //     'https://raw.githubusercontent.com/chiliz-chain/token-list/main/tokenlist.json',
  //   manualTokens: [
  //     {
  //       symbol: 'USDC',
  //       name: 'Bridged USDC (ChainPort)',
  //       address: '0xa37936F56249965d407E39347528a1A91eB1cbef',
  //       decimals: 6,
  //     },
  //     {
  //       symbol: 'PEPPER',
  //       name: 'PEPPER',
  //       address: '0x60F397acBCfB8f4e3234C659A3E10867e6fA6b67',
  //       decimals: 18,
  //     },
  //   ],
  //   fixtureSetupMethod: 'withNetworkControllerOnMainnet',
  //   blockExplorerUrl: 'https://explorer.chiliz.com',
  //   swapExecutionTokenSymbols: ['USDC', 'PEPPER'],
  //   swapExecutionRoutes: [
  //     { from: 'CHZ', to: 'USDC', amount: 5 },
  //     { from: 'USDC', to: 'PEPPER', amount: 0.55 },
  //     { from: 'PEPPER', to: 'CHZ', useMax: true },
  //   ],
  //   defaultSwapAmount: 20,
  //   gasFeeSponsoredByProtocol: true,
  //   requiresManualSetup: true,
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
 * Get custom network configs that require manual setup
 * These networks need to be added via UI during test execution
 * @returns Array of custom network configurations
 */
export function getSwapCustomNetworks(): NetworkSwapConfig[] {
  return SWAP_TEST_NETWORKS.filter((config) => config.requiresManualSetup === true);
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
  if (!config.tokenlistUrl && !config.manualTokens?.length) {
    throw new Error(
      'Network config must provide either tokenlistUrl or manualTokens',
    );
  }
  if (!config.fixtureSetupMethod) {
    throw new Error(
      'Network config missing required field: fixtureSetupMethod',
    );
  }

  if (config.swapExecutionRoutes?.length) {
    config.swapExecutionRoutes.forEach((route, routeIndex) => {
      if (!route.from || !route.to) {
        throw new Error(
          `Network config route #${routeIndex + 1} must include both from and to symbols`,
        );
      }

      if (!route.useMax && route.amount === undefined) {
        throw new Error(
          `Network config route #${routeIndex + 1} must include amount or set useMax=true`,
        );
      }
    });
  }
}
