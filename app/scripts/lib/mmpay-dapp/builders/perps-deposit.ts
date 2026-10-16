import type { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  ARBITRUM_USDC_ADDRESS,
  HYPERLIQUID_BRIDGE_ADDRESS,
  USDC_DECIMALS,
} from '../constants';
import { encodeErc20Transfer } from '../encode';
import type { MmPayDefinition } from '../types';

/**
 * Perps deposit MMPay definition.
 *
 * Hard-codes the Hyperliquid mainnet route (USDC on Arbitrum → Hyperliquid
 * bridge) rather than consulting `getDepositRoutes()`, which this background
 * module cannot reach. If Hyperliquid testnet is ever needed, add a sibling
 * builder and register it with its own `MmPayType`.
 *
 * Gas is intentionally omitted; callers should set `skipInitialGasEstimate`
 * when adding the transaction. If gas estimation fails during manual testing,
 * provide `gas: DEPOSIT_GAS_LIMIT` (165000) explicitly.
 */
export const perpsDepositDefinition: MmPayDefinition = {
  type: 'perpsDeposit',
  chainId: CHAIN_IDS.ARBITRUM,
  tokenDecimals: USDC_DECIMALS,
  build({ from, amountRaw }) {
    return {
      txParams: {
        from,
        to: ARBITRUM_USDC_ADDRESS,
        value: '0x0' as Hex,
        data: encodeErc20Transfer(HYPERLIQUID_BRIDGE_ADDRESS, amountRaw),
      },
      type: TransactionType.perpsDeposit,
      chainId: CHAIN_IDS.ARBITRUM,
      skipInitialGasEstimate: true,
    };
  },
};
