import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

/**
 * Determines whether a transaction should be displayed as gas-fee sponsored.
 *
 * This mirrors the legacy transaction breakdown behavior: a transaction must
 * be flagged as sponsored, but the label is suppressed for unsupported account
 * types, revoke delegation transactions, rejected transactions, and failed
 * transactions that never produced gas usage.
 *
 * @param options - The sponsorship evaluation options.
 * @param options.transaction - The transaction metadata to evaluate.
 * @param options.isHardwareWalletAccount - Whether the signing account cannot
 * use gas sponsorship.
 * @returns Whether the UI should render the network fee as paid by MetaMask.
 */
export function isTransactionGasFeeSponsored({
  transaction,
  isHardwareWalletAccount = false,
}: {
  transaction: TransactionMeta;
  isHardwareWalletAccount?: boolean;
}) {
  const { isGasFeeSponsored, status, type } = transaction;

  return (
    isGasFeeSponsored &&
    type !== TransactionType.revokeDelegation &&
    !isHardwareWalletAccount &&
    status !== TransactionStatus.rejected &&
    !(status === TransactionStatus.failed && !transaction.txReceipt?.gasUsed)
  );
}
