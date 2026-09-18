import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../../../store/actions';
import { ARBITRUM_USDC } from '../../../../pages/confirmations/constants/perps';
import { generateERC20TransferData } from '../../../../pages/confirmations/send-utils/send.utils';

export type CreatePerpsWithdrawTransactionParams = {
  accountAddress: Hex;
};

export type CreatedPerpsWithdrawTransaction = {
  transactionId: string;
};

/**
 * Creates the placeholder transaction used to launch the Perps withdraw
 * custom amount confirmation.
 *
 * The final withdraw is a Hyperliquid signed action, but confirmations need a
 * staged transaction shell so the user can choose the withdraw amount/token.
 *
 * @param params - Parameters for the withdraw transaction.
 * @param params.accountAddress - Selected account and eventual recipient.
 * @returns The created transaction ID.
 */
export async function createPerpsWithdrawTransaction({
  accountAddress,
}: CreatePerpsWithdrawTransactionParams): Promise<CreatedPerpsWithdrawTransaction> {
  const networkClientId = await findNetworkClientIdByChainId(
    CHAIN_IDS.ARBITRUM,
  );
  const transferData = generateERC20TransferData({
    toAddress: accountAddress,
    amount: '0x0',
    sendToken: ARBITRUM_USDC,
  });

  const txMeta = await addTransaction(
    {
      from: accountAddress,
      to: ARBITRUM_USDC.address,
      data: transferData,
      value: '0x0',
    },
    {
      networkClientId,
      type: TransactionType.perpsWithdraw,
    },
  );

  if (!txMeta?.id) {
    throw new Error('Perps withdraw transaction was not created');
  }

  return { transactionId: txMeta.id };
}
