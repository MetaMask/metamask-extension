import {
  ARBITRUM_MAINNET_CHAIN_ID_HEX,
  generateERC20TransferData,
  USDC_ARBITRUM_MAINNET_ADDRESS,
} from '@metamask/perps-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { mmPayRpcErrors } from '../errors';
import { defineMmPayRpcType } from './define-type';
import {
  assertPerpsEligible,
  toUsdcAmountRaw,
  validatePerpsPayParams,
  type PerpsPayParams,
} from './perps-shared';

/**
 * `perpsWithdraw`: the same placeholder USDC transfer to `from` the in-wallet
 * withdraw uses; the confirmation and Pay turn it into the Hyperliquid
 * withdraw.
 *
 * Limited to the selected account: the withdraw confirmation reads perps
 * balances for the selected account, not the transaction's `from`.
 */
export const perpsWithdrawTypeRegistry = defineMmPayRpcType<PerpsPayParams>({
  type: TransactionType.perpsWithdraw,
  validatePayParams: validatePerpsPayParams,
  assertPreconditions: async ({ from, messenger }) => {
    const selectedAccount = messenger.call(
      'AccountsController:getSelectedAccount',
    );

    if (selectedAccount.address.toLowerCase() !== from.toLowerCase()) {
      throw mmPayRpcErrors.notSelectedAccount(TransactionType.perpsWithdraw);
    }

    await assertPerpsEligible(messenger);
  },
  build: ({ from, payParams }) => ({
    chainId: ARBITRUM_MAINNET_CHAIN_ID_HEX as Hex,
    transactionParams: {
      from,
      to: USDC_ARBITRUM_MAINNET_ADDRESS,
      value: '0x0',
      data: generateERC20TransferData(from, toUsdcAmountRaw(payParams.amount)),
    },
    type: TransactionType.perpsWithdraw,
  }),
});
