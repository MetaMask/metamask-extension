import { TransactionType } from '@metamask/transaction-controller';

export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
export const ERC20_TRANSFER_FROM_SELECTOR = '0x23b872dd';
export const ERC20_TRANSFER_CALLDATA_LENGTH = 138;
export const ERC20_TRANSFER_FROM_CALLDATA_LENGTH = 202;

export type DecodedErc20Transfer = {
  amount: string;
  recipient: string;
};

/**
 * Decodes the recipient and exact integer amount from standard ERC-20
 * `transfer` and `transferFrom` calldata. Incomplete calldata (missing the
 * amount slot) is treated as undecodable so those rows stay out of Money
 * activity rather than rendering with a guessed amount.
 *
 * @param data - Transaction calldata.
 * @param type - Declared transaction type, when known.
 * @returns Recipient and raw amount, or undefined when the call is not a
 * complete standard transfer.
 */
export function decodeErc20Transfer(
  data: string | undefined,
  type: TransactionType | undefined,
): DecodedErc20Transfer | undefined {
  if (!data) {
    return undefined;
  }

  const normalizedData = data.toLowerCase();
  const hasTransferCalldata =
    normalizedData.startsWith(ERC20_TRANSFER_SELECTOR) &&
    normalizedData.length >= ERC20_TRANSFER_CALLDATA_LENGTH;
  const hasTransferFromCalldata =
    normalizedData.startsWith(ERC20_TRANSFER_FROM_SELECTOR) &&
    normalizedData.length >= ERC20_TRANSFER_FROM_CALLDATA_LENGTH;
  const hasDeclaredStandardType =
    type === TransactionType.tokenMethodTransfer ||
    type === TransactionType.tokenMethodTransferFrom;
  const isTransfer =
    hasTransferCalldata &&
    (!hasDeclaredStandardType || type === TransactionType.tokenMethodTransfer);
  const isTransferFrom =
    hasTransferFromCalldata &&
    (!hasDeclaredStandardType ||
      type === TransactionType.tokenMethodTransferFrom);
  if (!isTransfer && !isTransferFrom) {
    return undefined;
  }

  const recipientSlot = isTransfer
    ? normalizedData.slice(10, 74)
    : normalizedData.slice(74, 138);
  const amountSlot = isTransfer
    ? normalizedData.slice(74, 138)
    : normalizedData.slice(138, 202);
  if (
    !/^[0-9a-f]{64}$/u.test(recipientSlot) ||
    !/^[0-9a-f]{64}$/u.test(amountSlot)
  ) {
    return undefined;
  }

  return {
    recipient: `0x${recipientSlot.slice(-40)}`,
    amount: BigInt(`0x${amountSlot}`).toString(),
  };
}
