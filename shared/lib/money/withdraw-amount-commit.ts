import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

/**
 * Encoded nested withdraw + transfer calldata returned by a Money Account
 * amount commit. Shared across the background encoder and the UI confirm
 * bridge so the contract cannot drift.
 */
export type MoneyAccountWithdrawAmountUpdate = {
  transactionData?: Hex;
  transferData: Hex;
  withdrawData: Hex;
};

/**
 * Picks who the nested mUSD transfer of a withdrawal pays. Same-chain mUSD is
 * not quoted, so it pays the recipient directly. Any other receive token is
 * quoted and bridged from the money account, so the mUSD stays there and Pay
 * delivers the output to the recipient.
 *
 * @param options - Options bag.
 * @param options.moneyAccountAddress - Money account that sends the batch.
 * @param options.paymentToken - Selected Pay receive token, if any.
 * @param options.recipient - Account that receives the withdrawal.
 * @param options.transaction - The withdrawal transaction.
 * @param options.paymentToken.address
 * @param options.paymentToken.chainId
 * @returns The address the nested mUSD transfer pays.
 */
export function getMoneyAccountWithdrawTransferTarget({
  moneyAccountAddress,
  paymentToken,
  recipient,
  transaction,
}: {
  moneyAccountAddress: Hex;
  paymentToken?: { address: Hex; chainId: Hex };
  recipient: Hex;
  transaction: TransactionMeta;
}): Hex {
  if (!paymentToken) {
    return recipient;
  }

  const musdAddress = transaction.nestedTransactions?.[1]?.to;
  const isDirect =
    paymentToken.chainId.toLowerCase() === transaction.chainId?.toLowerCase() &&
    paymentToken.address.toLowerCase() === musdAddress?.toLowerCase();

  return isDirect ? recipient : moneyAccountAddress;
}
