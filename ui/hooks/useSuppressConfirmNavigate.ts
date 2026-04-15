import { useSelector } from 'react-redux';
import type { ApprovalRequest } from '@metamask/approval-controller';
import type { Json } from '@metamask/utils';
import { getExtensionSkipTransactionStatusPage } from '../../shared/lib/selectors/smart-transactions';
import { isInteractiveUI } from '../../shared/lib/environment-type';
import { useCallback } from 'react';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../shared/constants/app';

export function useSuppressNavigation() {
  const transactionToastsEnabled = useSelector(
    getExtensionSkipTransactionStatusPage,
  );
  const isInteractive = isInteractiveUI(); // sidepanel | popup | fullscreen

  return useCallback(
    (
      confirmationId: string | undefined,
      confirmations: ApprovalRequest<Record<string, Json>>[],
      hasApprovals: boolean,
    ) => {
      // Ignore if transaction toasts are not enabled and we're not in an interactive environment
      if (!isInteractive || !transactionToastsEnabled) {
        return false;
      }

      const hasNoConfirmations = confirmations?.length <= 0 || !confirmationId;
      // Suppress if there is a background pending approval from smart transactions and no confirmation in the UI
      if (hasApprovals && hasNoConfirmations) {
        return true;
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
    [isInteractive, transactionToastsEnabled],
  );
}
