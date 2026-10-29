import { TransactionStatus } from '@metamask/transaction-controller';

/**
 * Transaction statuses that indicate a transaction is "in flight"
 * (user-approved but not yet terminal):
 *
 * - approved: User confirmed in wallet, waiting for submission
 * - signed:   Transaction signed, waiting for broadcast
 * - submitted: Transaction submitted to network, waiting for confirmation
 *
 * The `approved` status is extremely transient — it transitions to `signed`
 * then `submitted` within the same tick — so we match all three to reliably
 * detect when a transaction has been approved by the user.
 */
export const IN_FLIGHT_STATUSES: string[] = [
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
];
