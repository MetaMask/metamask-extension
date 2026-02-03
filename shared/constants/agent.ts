/**
 * Feature flag for agent mode
 */
export const AGENT_MODE_ENABLED = process.env.AGENT_MODE_ENABLED === 'true';

/**
 * Default spend limits for new agents (in USD with 6 decimals)
 */
export const DEFAULT_AGENT_DAILY_LIMIT = '50000000'; // $50
export const DEFAULT_AGENT_PER_TX_LIMIT = '10000000'; // $10

/**
 * Approval expiration time in milliseconds
 */
export const AGENT_APPROVAL_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum number of activity log entries to keep
 */
export const AGENT_ACTIVITY_LOG_MAX = 500;

/**
 * Well-known protocol addresses (mainnet)
 */
export const KNOWN_PROTOCOLS = {
  UNISWAP_V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  UNISWAP_UNIVERSAL_ROUTER: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  ONEINCH_ROUTER: '0x1111111254EEB25477B68fb85Ed929f73A960582',
  SUSHISWAP_ROUTER: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
} as const;

/**
 * Known method selectors
 */
export const KNOWN_METHOD_SELECTORS = {
  APPROVE: '0x095ea7b3',
  TRANSFER: '0xa9059cbb',
  TRANSFER_FROM: '0x23b872dd',
  SWAP_EXACT_TOKENS: '0x38ed1739',
  SWAP_EXACT_ETH: '0x7ff36ab5',
  MULTICALL: '0x5ae401dc',
  EXECUTE: '0x3593564c',
} as const;

/**
 * Methods that are blocked by default for agents
 */
export const DEFAULT_BLOCKED_METHODS = [
  KNOWN_METHOD_SELECTORS.APPROVE, // Prevent unlimited token approvals
];

/**
 * Methods that always require user approval
 */
export const ALWAYS_REQUIRE_APPROVAL_METHODS = [
  'multicall',
  'execute',
  'permitTransferFrom',
  'permit',
];
