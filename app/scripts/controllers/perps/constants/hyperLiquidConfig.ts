/**
 * HyperLiquid Configuration Constants
 * Network endpoints, token addresses, and protocol-specific settings
 */

// Network Constants
export const ARBITRUM_MAINNET_CHAIN_ID_HEX = '0xa4b1';
export const ARBITRUM_MAINNET_CHAIN_ID = '42161';
export const ARBITRUM_TESTNET_CHAIN_ID = '421614';
export const ARBITRUM_MAINNET_CAIP_CHAIN_ID = `eip155:${ARBITRUM_MAINNET_CHAIN_ID}`;
export const ARBITRUM_TESTNET_CAIP_CHAIN_ID = `eip155:${ARBITRUM_TESTNET_CHAIN_ID}`;

// Hyperliquid chain constants
export const HYPERLIQUID_MAINNET_CHAIN_ID = '0x3e7'; // 999 in decimal
export const HYPERLIQUID_TESTNET_CHAIN_ID = '0x3e6'; // 998 in decimal
export const HYPERLIQUID_MAINNET_CAIP_CHAIN_ID = 'eip155:999';
export const HYPERLIQUID_TESTNET_CAIP_CHAIN_ID = 'eip155:998';
export const HYPERLIQUID_NETWORK_NAME = 'Hyperliquid';

// Token Constants
export const USDC_SYMBOL = 'USDC';
export const USDC_NAME = 'USD Coin';
export const USDC_DECIMALS = 6;
export const TOKEN_DECIMALS = 18;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ZERO_BALANCE = '0x0';

// Network constants
export const ARBITRUM_SEPOLIA_CHAIN_ID = '0x66eee'; // 421614 in decimal

// USDC token addresses
export const USDC_ETHEREUM_MAINNET_ADDRESS =
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDC_ARBITRUM_MAINNET_ADDRESS =
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
export const USDC_ARBITRUM_TESTNET_ADDRESS =
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// USDC token icon URL
export const USDC_TOKEN_ICON_URL = `https://static.cx.metamask.io/api/v1/tokenIcons/1/${USDC_ETHEREUM_MAINNET_ADDRESS}.png`;

// WebSocket Endpoints
export const HYPERLIQUID_ENDPOINTS = {
  mainnet: 'wss://api.hyperliquid.xyz/ws',
  testnet: 'wss://api.hyperliquid-testnet.xyz/ws',
} as const;

// Asset icons base URL
export const HYPERLIQUID_ASSET_ICONS_BASE_URL =
  'https://app.hyperliquid.xyz/coins/';

// MetaMask-hosted Perps asset icons
export const METAMASK_PERPS_ICONS_BASE_URL =
  'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/icons/eip155:999/';

// Trading Configuration Constants
export const TRADING_DEFAULTS = {
  leverage: 3,
  marginPercent: 10,
  takeProfitPercent: 0.3,
  stopLossPercent: 0.1,
  amount: {
    mainnet: 10,
    testnet: 10,
  },
} as const;

// Fee configuration
export const FEE_RATES = {
  taker: 0.00045, // 0.045%
  maker: 0.00015, // 0.015%
} as const;

// HIP-3 Fee Configuration
export const HIP3_FEE_CONFIG = {
  GrowthModeScale: 0.1,
  DefaultDeployerFeeScale: 1.0,
  PerpDexsCacheTtlMs: 5 * 60 * 1000,
  FeeMultiplier: 2,
} as const;

// Builder fee configuration
export const BUILDER_FEE_CONFIG = {
  TestnetBuilder: '0x724e57771ba749650875bd8adb2e29a85d0cacfa',
  MainnetBuilder: '0xe95a5e31904e005066614247d309e00d8ad753aa',
  MaxFeeDecimal: 0.001,
  MaxFeeTenthsBps: 100,
  MaxFeeRate: '0.1%',
} as const;

// Referral code configuration
export const REFERRAL_CONFIG = {
  MainnetCode: 'MMCSI',
  TestnetCode: 'MMCSITEST',
} as const;

// Withdrawal fees
export const HYPERLIQUID_WITHDRAWAL_FEE = 1;
export const METAMASK_WITHDRAWAL_FEE = 0;
export const METAMASK_WITHDRAWAL_FEE_PLACEHOLDER = '$0.00';
export const WITHDRAWAL_ESTIMATED_TIME = '5 minutes';

// Withdrawal timing
export const HYPERLIQUID_WITHDRAWAL_MINUTES = 5;
export const HYPERLIQUID_WITHDRAWAL_PROGRESS_INTERVAL_MS = 30000;

// Order book spread constants
export const ORDER_BOOK_SPREAD = {
  DefaultBidMultiplier: 0.9999,
  DefaultAskMultiplier: 1.0001,
} as const;

// Deposit constants
export const DEPOSIT_CONFIG = {
  EstimatedGasLimit: 150000,
  DefaultSlippage: 1,
  BridgeQuoteTimeout: 1000,
  RefreshRate: 30000,
  EstimatedTime: {
    DirectDeposit: '3-5 seconds',
    SameChainSwap: '30-60 seconds',
  },
} as const;

// HIP-3 Asset ID calculation constants
export const HIP3_ASSET_ID_CONFIG = {
  BaseAssetId: 100000,
  DexMultiplier: 10000,
} as const;

// Basis points conversion
export const BASIS_POINTS_DIVISOR = 10000;

// HIP-3 asset market type classifications
export const HIP3_ASSET_MARKET_TYPES: Record<
  string,
  'equity' | 'commodity' | 'forex' | 'crypto'
> = {
  'xyz:TSLA': 'equity',
  'xyz:NVDA': 'equity',
  'xyz:XYZ100': 'equity',
  'xyz:GOLD': 'commodity',
  'xyz:SILVER': 'commodity',
  'xyz:CL': 'commodity',
  'xyz:COPPER': 'commodity',
} as const;

// Testnet HIP-3 DEX configuration
export const TESTNET_HIP3_CONFIG = {
  EnabledDexs: ['xyz'] as string[],
  AutoDiscoverAll: false,
} as const;

// HIP-3 margin management configuration
export const HIP3_MARGIN_CONFIG = {
  BufferMultiplier: 1.003,
  RebalanceDesiredBuffer: 0.1,
  RebalanceMinThreshold: 0.1,
} as const;

// USDH collateral configuration
export const USDH_CONFIG = {
  TokenName: 'USDH',
  SwapSlippageBps: 10,
} as const;

// Progress bar constants
export const INITIAL_AMOUNT_UI_PROGRESS = 10;
export const WITHDRAWAL_PROGRESS_STAGES = [
  25, 35, 45, 55, 65, 75, 85, 90, 95, 98,
];
export const PROGRESS_BAR_COMPLETION_DELAY_MS = 500;

// HyperLiquid protocol configuration
export const HYPERLIQUID_CONFIG = {
  ExchangeName: 'HlPerp',
} as const;

// Helper functions
export function getWebSocketEndpoint(isTestnet: boolean): string {
  return isTestnet
    ? HYPERLIQUID_ENDPOINTS.testnet
    : HYPERLIQUID_ENDPOINTS.mainnet;
}

export function getChainId(isTestnet: boolean): string {
  return isTestnet ? ARBITRUM_TESTNET_CHAIN_ID : ARBITRUM_MAINNET_CHAIN_ID;
}

export function getCaipChainId(isTestnet: boolean): string {
  return isTestnet
    ? ARBITRUM_TESTNET_CAIP_CHAIN_ID
    : ARBITRUM_MAINNET_CAIP_CHAIN_ID;
}
