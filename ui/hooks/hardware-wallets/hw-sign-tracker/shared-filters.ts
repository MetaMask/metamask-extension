import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HwSignTrackerAction, SignedEventClassifier } from './types';
import {
  APPROVAL_TYPES,
  BRIDGE_TRANSACTION_TYPES,
  TRADE_TYPES,
} from './constants';

/**
 * Checks whether a transaction matches the expected sender address and is one
 * of the tracked hardware-wallet signing types.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param targetFrom - The expected sender address (lowercased).
 * @param trackedTypes - The set of tracked transaction types.
 * @returns True if the transaction matches.
 */
export function matchesTx(
  transactionMeta: TransactionMeta,
  targetFrom: string | undefined,
  trackedTypes: Set<TransactionType> | null = BRIDGE_TRANSACTION_TYPES,
): boolean {
  if (!targetFrom) {
    return false;
  }
  const normalizedFrom = transactionMeta.txParams.from?.toLowerCase();
  if (normalizedFrom !== targetFrom) {
    return false;
  }
  return trackedTypes
    ? trackedTypes.has(transactionMeta.type as TransactionType)
    : true;
}

/**
 * Classifies a signed transaction by type into the appropriate state machine
 * action.
 *
 * @param type - The transaction type.
 * @returns The action to dispatch, or null if the type is not recognized.
 */
export function classifySignedTransactionType(
  type: TransactionType,
): HwSignTrackerAction | null {
  if (APPROVAL_TYPES.has(type)) {
    return { type: HardwareWalletSignatureEvent.FirstSignatureSubmitted };
  }
  if (TRADE_TYPES.has(type)) {
    return { type: HardwareWalletSignatureEvent.TransactionSubmitted };
  }
  return null;
}

/**
 * Default classifier that maps a transaction's type to the corresponding
 * hardware-wallet signature event. Returns null for unrecognized types.
 *
 * @param txMeta - The transaction metadata to classify.
 * @returns The classified signature event, or null if unclassifiable.
 */
export const defaultEventClassifier: SignedEventClassifier = (txMeta) =>
  txMeta.type ? classifySignedTransactionType(txMeta.type) : null;
