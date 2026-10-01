import type { CaipAssetType, Hex, Json } from '@metamask/utils';
import { parseAbi } from 'viem';
import { BOTTOM_NAV_AB_TEST_KEY } from '../../../../shared/lib/ab-testing/configs/bottom-nav-bar';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME,
  MONEY_ENABLE_ACTIVITY_DETAILS_FLAG_NAME,
  MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
} from '../../../../shared/lib/money/feature-flags';

/**
 * Money Account address derived from `E2E_SRP` at the fixed money derivation
 * path. Pinned by `money-account-vault-restore.spec.ts`.
 */
export const MONEY_ACCOUNT_ADDRESS: Hex =
  '0xd5fe9b0579443e7025cf3309ba420977710e7183';

/** Second HD account of `E2E_SRP` (`ADDITIONAL_ACCOUNT_FIXTURE_VAULT`). */
export const ACCOUNT_2_FIXTURE_ID = 'e9976a84-110e-46c3-9811-e2da7b5528d3';

export const MAINNET_USDC_ADDRESS: Hex =
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const MAINNET_USDC_ASSET_ID: CaipAssetType = `eip155:1/erc20:${MAINNET_USDC_ADDRESS}`;
export const MAINNET_USDC_ASSET_ID_LOWERCASE =
  MAINNET_USDC_ASSET_ID.toLowerCase();
export const MAINNET_NATIVE_ASSET_ID = 'eip155:1/slip44:60';
/** Native assets the default fixture prices as ETH (see `default-fixture.json`). */
export const DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS = [
  'eip155:1337/slip44:1',
  'eip155:42161/slip44:60',
  'eip155:59144/slip44:60',
] as const;
export const NATIVE_TOKEN_ADDRESS: Hex =
  '0x0000000000000000000000000000000000000000';

export const MUSD_MONAD_ADDRESS: Hex =
  '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
export const MONAD_CHAIN_ID_DECIMAL = Number(CHAIN_IDS.MONAD);
/**
 * EIP-7702 delegation designator pointing at the production
 * `confirmations_eip_7702` contract for Monad (see the feature-flag registry).
 */
export const MONEY_ACCOUNT_DELEGATED_CODE =
  '0xef010063c0c19a282a1b52b07dd5a65b58948a07dae32b';
export const MONAD_NATIVE_ASSET_ID = 'eip155:143/slip44:268435779';
export const MUSD_MONAD_ASSET_ID = `eip155:143/erc20:${MUSD_MONAD_ADDRESS}`;

/**
 * Holdings mirror the mobile Money Account deposit specs at extension scale:
 * the Anvil `with100Usdc100Usdt.json` state seeds 100 USDC so the percentage
 * buttons resolve to round amounts (25% = $25, 50% = $50, Max = $100).
 */
export const USDC_BALANCE_HUMAN = 100;
export const ETH_BALANCE_HUMAN = 25;
/**
 * Pay converts USDC to USD via its ETH-denominated rate (USD → ETH → USD).
 * A power-of-two ETH price keeps that round trip exact in floating point, so
 * 100 USDC is $100.00 and the percentage buttons yield 25 / 50 / 100, not
 * 24.99 / 49.99 / 99.99.
 */
export const ETH_USD_PRICE = 2048;
export const USDC_USD_PRICE = 1;
export const MON_USD_PRICE = 1;
export const MUSD_USD_PRICE = 1;

export const USD_PRICE_BY_ASSET_ID: Record<string, number> = {
  [MAINNET_NATIVE_ASSET_ID]: ETH_USD_PRICE,
  [MAINNET_USDC_ASSET_ID_LOWERCASE]: USDC_USD_PRICE,
  [MONAD_NATIVE_ASSET_ID]: MON_USD_PRICE,
  [MUSD_MONAD_ASSET_ID.toLowerCase()]: MUSD_USD_PRICE,
};

export const RELAY_API_BASE_URL = 'https://api.relay.link';
export const PRICE_API_BASE_URL = 'https://price.api.cx.metamask.io';
export const GAS_API_BASE_URL = 'https://gas.api.cx.metamask.io';
export const MONAD_TX_SENTINEL_URL =
  'https://tx-sentinel-monad-mainnet.api.cx.metamask.io';

/** Relay solver deposit address used as the on-chain source-leg recipient. */
export const RELAY_SOLVER_ADDRESS: Hex =
  '0x00000000aa467eba42a3d604b3d74d63b2b6c6cb';
export const MONAD_SETTLEMENT_HASH: Hex =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
export const MONAD_BLOCK_NUMBER = '0x1234568';
export const MONAD_BLOCK_HASH: Hex =
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
export const SENTINEL_RELAY_UUID = 'money-account-deposit-e2e-uuid';

export const ERC20_TRANSFER_EVENT_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
export const UINT256_ZERO = `0x${'0'.repeat(64)}`;
export const UINT256_MAX = `0x${'f'.repeat(64)}`;
export const UINT8_SIX = `0x${'0'.repeat(63)}6`;
export const ERC20_ALLOWANCE_SELECTOR = '0xdd62ed3e';
export const ERC20_BALANCE_OF_SELECTOR = '0x70a08231';
export const ERC20_DECIMALS_SELECTOR = '0x313ce567';
export const MULTICALL3_AGGREGATE3_SELECTOR = '0x82ad56cb';
/**
 * Raw USDC base units for {@link USDC_BALANCE_HUMAN}.
 *
 * `TransactionPayController` reads `AssetsController` amounts as raw integers
 * (`formatStateForTransactionPay` hex-encodes them with no decimals). Seeding
 * the human `"100"` makes the pay snapshot 100 base units ($0.0001). That
 * snapshot lands after the percentage buttons have already shown $25/$50 and
 * turns "Add funds" into "Insufficient funds", so confirm never submits.
 * The token list still treats this field as human and scales by decimals;
 * the confirmation uses the smaller of the two, so the displayed balance
 * stays $100.
 */
export const USDC_BALANCE_RAW = BigInt(USDC_BALANCE_HUMAN) * 10n ** 6n;

export const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
]);

/**
 * Storage slot of the `balances` mapping in the ERC-20 bytecode shipped in
 * `with100Usdc100Usdt.json` (the seeded storage key for the default account
 * hashes to this slot).
 */
export const ANVIL_USDC_BALANCES_SLOT = 2n;

export const MONEY_ACCOUNT_FLAG_VALUE = {
  enabled: true,
  minimumVersion: '0.0.0',
};

export type MoneyDepositSourceToken = 'usdc' | 'eth';

/**
 * Remote flags the Money Account deposit flow needs on top of production
 * defaults. The geolocation mock returns `US-TX` and production blocks `US`,
 * so the block list is cleared. Activity details are enabled so the Money
 * home activity rows open the transaction details page. The bottom nav
 * treatment exposes the Money tab.
 */
export const MONEY_ACCOUNT_DEPOSIT_REMOTE_FLAGS: Record<string, Json> = {
  [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: MONEY_ACCOUNT_FLAG_VALUE,
  [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: { blockedRegions: [] },
  [MONEY_ENABLE_ACTIVITY_DETAILS_FLAG_NAME]: true,
  [BOTTOM_NAV_AB_TEST_KEY]: 'treatment',
};

/**
 * `confirmations_pay_tokens` override that makes Mainnet ETH the preferred
 * pay token for Money Account deposits. Mirrors the mobile
 * `money-account-deposit-payment-methods` prefill scenario.
 */
export const PREFILL_ETH_PAY_TOKENS_FLAG: Json = {
  preferredTokens: {
    overrides: {
      moneyAccountDeposit: [
        {
          address: NATIVE_TOKEN_ADDRESS,
          chainId: CHAIN_IDS.MAINNET,
          name: 'ETH',
          successRate: 100,
        },
      ],
    },
  },
};

export const SUGGESTED_GAS_FEES = {
  low: {
    suggestedMaxPriorityFeePerGas: '1',
    suggestedMaxFeePerGas: '2',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 30000,
  },
  medium: {
    suggestedMaxPriorityFeePerGas: '1.5',
    suggestedMaxFeePerGas: '3',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 45000,
  },
  high: {
    suggestedMaxPriorityFeePerGas: '2',
    suggestedMaxFeePerGas: '4',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
  },
  estimatedBaseFee: '1',
  networkCongestion: 0.1,
  latestPriorityFeeRange: ['1', '2'],
  historicalPriorityFeeRange: ['1', '4'],
  historicalBaseFeeRange: ['1', '2'],
  priorityFeeTrend: 'stable',
  baseFeeTrend: 'stable',
};
