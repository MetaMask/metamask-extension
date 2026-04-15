import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { ApprovalRequest } from '@metamask/approval-controller';
import type { Json } from '@metamask/utils';
import { getExtensionSkipTransactionStatusPage } from '../../shared/lib/selectors/smart-transactions';
import { isInteractiveUI } from '../../shared/lib/environment-type';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../shared/constants/app';
import { selectSmartTransactions } from '../selectors/toast';

// Suppress navigation for smart transaction status page confirmations
// when transaction toasts are enabled
export function useSuppressNavigation() {
  const transactionToastsEnabled = useSelector(
    getExtensionSkipTransactionStatusPage,
  );
  const smartTransactions = useSelector(selectSmartTransactions);
  const isInteractive = isInteractiveUI(); // sidepanel | popup | fullscreen

  return useCallback(
    (
      confirmationId: string | undefined,
      confirmations: ApprovalRequest<Record<string, Json>>[],
    ) => {
      // Ignore if transaction toasts are not enabled and we're not in an interactive environment
      if (!isInteractive || !transactionToastsEnabled) {
        return false;
      }

      if (!confirmationId) {
        return smartTransactions.length > 0;
      }

      const confirmation = confirmations.find((c) => c.id === confirmationId);
      // Suppress if the confirmation is a smart transaction status
      if (
        confirmation?.type ===
          SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage &&
        confirmationId
      ) {
        return true;
      }

      return false;
    },
    [isInteractive, smartTransactions.length, transactionToastsEnabled],
  );
}
