import {
  ARBITRUM_MAINNET_CHAIN_ID_HEX,
  DEPOSIT_CONFIG,
  generateERC20TransferData,
  HYPERLIQUID_BRIDGE_CONTRACTS,
  USDC_ARBITRUM_MAINNET_ADDRESS,
} from '@metamask/perps-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { defineMmPayRpcType } from './define-type';
import {
  assertPerpsEligible,
  toUsdcAmountRaw,
  validatePerpsPayParams,
  type PerpsPayParams,
} from './perps-shared';

/**
 * `perpsDeposit`: a USDC transfer to the Hyperliquid bridge on Arbitrum,
 * matching the in-wallet deposit. Uses the mainnet route directly, while the
 * in-wallet flow takes it from the active perps provider.
 */
export const perpsDepositTypeRegistry = defineMmPayRpcType<PerpsPayParams>({
  type: TransactionType.perpsDeposit,
  validatePayParams: validatePerpsPayParams,
  assertPreconditions: ({ messenger }) => assertPerpsEligible(messenger),
  build: ({ from, payParams }) => ({
    chainId: ARBITRUM_MAINNET_CHAIN_ID_HEX as Hex,
    transactionParams: {
      from,
      to: USDC_ARBITRUM_MAINNET_ADDRESS,
      value: '0x0',
      data: generateERC20TransferData(
        HYPERLIQUID_BRIDGE_CONTRACTS.mainnet.contractAddress,
        toUsdcAmountRaw(payParams.amount),
      ),
      gas: toHex(DEPOSIT_CONFIG.EstimatedGasLimit),
    },
    type: TransactionType.perpsDeposit,
    skipInitialGasEstimate: true,
  }),
});
