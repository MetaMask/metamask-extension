/**
 * Shared balance, gas, and network values for max-amount parity E2E tests.
 *
 * Send and swap specs import these directly. Fixture builders and Mockttp
 * helpers live in `max-amount-parity.ts`.
 */

import type { CaipAssetType } from '@metamask/utils';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  MONAD_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { NETWORK_CLIENT_ID } from '../../constants';

/** Human native balance seeded for every network row. */
export const NATIVE_BALANCE = '25';

/**
 * 25 * 10^18 wei. Matches {@link NATIVE_BALANCE} for `eth_getBalance` and the
 * account tracker.
 */
export const NATIVE_BALANCE_HEX = '0x15af1d78b58c40000';

/**
 * Gas limit returned by `eth_estimateGas`.
 * Included RPCs apply `confirmations_gas_buffer.included` (1.5), so the
 * confirmation uses 750000 gas. 750000 * 2000 gwei = 1.5 native units.
 */
export const GAS_LIMIT_HEX = '0x7a120';

/** 2000 gwei, in wei. Matches `suggestedMaxFeePerGas` on every gas API tier. */
export const MAX_FEE_PER_GAS_HEX = '0x1d1a94a2000';

/**
 * Buffer applied to `eth_estimateGas` for Infura (included) RPCs.
 * From `confirmations_gas_buffer.included` in the production flag registry.
 */
export const GAS_BUFFER = 1.5;

/** Native-unit fee the confirmation should subtract: buffered gas * max fee. */
export const GAS_FEE_NATIVE = 1.5;

/**
 * How far the send/confirmation gap may drift from {@link GAS_FEE_NATIVE}.
 * Large enough to absorb display rounding, small enough that a missed gas
 * subtraction (a full 1 native unit) still fails.
 */
export const GAS_FEE_TOLERANCE = 0.05;

/** Numeric tolerance for amounts that should match exactly. */
export const AMOUNT_TOLERANCE = 1e-8;

export const MAX_SEND_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

export type MaxAmountNetwork = {
  chainId: string;
  chainIdDecimal: number;
  assetId: CaipAssetType;
  symbol: string;
  name: string;
  networkClientId: string;
  infuraHost: string;
  /** Human units held back by Swap Max. `0` on Ethereum, `10` on Monad. */
  swapReserve: string;
  sentinelNetwork: string;
};

export const MAX_AMOUNT_NETWORKS: MaxAmountNetwork[] = [
  {
    chainId: CHAIN_IDS.MAINNET,
    chainIdDecimal: 1,
    assetId: 'eip155:1/slip44:60',
    symbol: 'ETH',
    name: MAINNET_DISPLAY_NAME,
    networkClientId: NETWORK_CLIENT_ID.MAINNET,
    infuraHost: 'mainnet.infura.io',
    swapReserve: '0',
    sentinelNetwork: 'ethereum-mainnet',
  },
  {
    chainId: CHAIN_IDS.MONAD,
    chainIdDecimal: 143,
    assetId: 'eip155:143/slip44:268435779',
    symbol: 'MON',
    name: MONAD_DISPLAY_NAME,
    networkClientId: 'monad-mainnet',
    infuraHost: 'monad-mainnet.infura.io',
    swapReserve: '10',
    sentinelNetwork: 'monad-mainnet',
  },
];
