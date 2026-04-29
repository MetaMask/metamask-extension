import { TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { MetaMetricsHardwareWalletRecoveryLocation } from '../../shared/constants/metametrics';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../helpers/constants/routes';
import { getUnapprovedTransaction } from '../selectors';
import { selectUnapprovedMessage } from '../selectors/signatures';

const SWAP_FLOW_TRANSACTION_TYPES: ReadonlySet<TransactionType> = new Set([
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.swapAndSend,
  TransactionType.bridge,
  TransactionType.bridgeApproval,
]);

/**
 * Derives the Segment `location` property for hardware wallet recovery UI.
 *
 * @returns Location for the current route and pending request.
 */
export function useHardwareWalletRecoveryLocation(): MetaMetricsHardwareWalletRecoveryLocation {
  const { pathname } = useLocation();
  const { id: confirmationId } = useParams();

  const transaction = useSelector((state) =>
    confirmationId
      ? getUnapprovedTransaction(state, confirmationId)
      : undefined,
  );
  const message = useSelector((state) =>
    confirmationId ? selectUnapprovedMessage(state, confirmationId) : undefined,
  );

  if (
    pathname.startsWith(CROSS_CHAIN_SWAP_ROUTE) ||
    pathname.includes('/swaps/')
  ) {
    return MetaMetricsHardwareWalletRecoveryLocation.Swaps;
  }

  if (pathname.includes(SIGNATURE_REQUEST_PATH)) {
    return MetaMetricsHardwareWalletRecoveryLocation.Message;
  }

  if (
    pathname.startsWith(CONFIRM_TRANSACTION_ROUTE) ||
    pathname.startsWith(CONFIRMATION_V_NEXT_ROUTE)
  ) {
    if (message) {
      return MetaMetricsHardwareWalletRecoveryLocation.Message;
    }
    if (
      transaction?.type &&
      SWAP_FLOW_TRANSACTION_TYPES.has(transaction.type as TransactionType)
    ) {
      return MetaMetricsHardwareWalletRecoveryLocation.Swaps;
    }
  }

  return MetaMetricsHardwareWalletRecoveryLocation.Send;
}
