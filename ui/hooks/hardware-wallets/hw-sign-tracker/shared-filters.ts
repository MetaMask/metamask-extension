import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HwSignTrackerAction } from './types';
import { ALL_BATCH_TYPES, APPROVAL_TYPES, TRADE_TYPES } from './constants';

/**
 * Checks whether a transaction matches the expected sender address and is one
 * of the tracked bridge/swap types.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param targetFrom - The expected sender address (lowercased).
 * @returns True if the transaction matches.
 */
export function matchesTx(
  transactionMeta: TransactionMeta,
  targetFrom: string | undefined,
): boolean {
  if (!targetFrom) {
    return false;
  }
  const normalizedFrom = transactionMeta.txParams.from?.toLowerCase();
  if (normalizedFrom !== targetFrom) {
    return false;
  }
  return ALL_BATCH_TYPES.has(transactionMeta.type as TransactionType);
}

/**
 * Classifies a signed transaction by type into the appropriate state machine
 * action.
 *
 * @param type - The transaction type.
 * @returns The action to dispatch, or null if the type is not recognized.
 */
export function classifySignedEvent(
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
