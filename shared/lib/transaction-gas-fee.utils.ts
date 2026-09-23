import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

/**
 * Returns the latest gas-fee sponsorship availability reported by simulation.
 * Falls back to the deprecated sponsorship property for transaction types and
 * persisted records that have not migrated to the availability property.
 *
 * @param transaction - The transaction metadata to inspect.
 * @returns Whether gas-fee sponsorship is currently available.
 */
export function isTransactionGasFeeSponsorshipAvailable(
  transaction: TransactionMeta | undefined,
): boolean {
  return Boolean(
    transaction?.isGasFeeSponsoredAvailable ?? transaction?.isGasFeeSponsored,
  );
}

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
