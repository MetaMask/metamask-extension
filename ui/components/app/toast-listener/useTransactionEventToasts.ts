import { useEffect } from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Transaction } from '@metamask/keyring-api';
import { useMessenger } from '../../../hooks/useMessenger';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';
import {
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from './toast-lifecycle';

export const toastListenerCapabilities = defineAllowedRouteCapabilities({
  actions: [],
  events: [
    'TransactionController:transactionStatusUpdated',
    'MultichainTransactionsController:transactionSubmitted',
    'MultichainTransactionsController:transactionConfirmed',
    'AccountsController:accountTransactionsUpdated',
  ],
});

type ToastListenerMessenger = RouteMessengerFromCapabilities<
  typeof toastListenerCapabilities
>;

// Flows with custom toasts — excluded for now from generic messenger event toasts.
const excludedTransactionTypes: TransactionType[] = [
  TransactionType.musdConversion,
  TransactionType.musdClaim,
  TransactionType.musdRelayDeposit,
  TransactionType.perpsDeposit,
  TransactionType.perpsDepositAndOrder,
  TransactionType.perpsWithdraw,
  TransactionType.perpsRelayDeposit,
  TransactionType.shieldSubscriptionApprove,
];

function isExcludedTransactionType(transactionMeta: TransactionMeta): boolean {
  return hasTransactionType(transactionMeta, excludedTransactionTypes);
}

const failedStatuses = new Set(['failed', 'dropped', 'rejected', 'cancelled']);

function generateToastId(id: string): string {
  return `tx-${id}`;
}

function extractPayload<Type>(raw: Type | [Type]): Type {
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Subscribes to background transaction lifecycle events via the UI messenger
 */
export function useTransactionEventToasts(): void {
  const messenger = useMessenger<ToastListenerMessenger>();

  useEffect(() => {
    // EVM — single event covers all status transitions
    const handleEvmStatusUpdate = (
      raw:
        | { transactionMeta: TransactionMeta }
        | [{ transactionMeta: TransactionMeta }],
    ) => {
      const { transactionMeta } = extractPayload(raw);
      if (!transactionMeta) {
        return;
      }

      const { id, status } = transactionMeta;
      if (!id || !status) {
        return;
      }

      if (isExcludedTransactionType(transactionMeta)) {
        return;
      }

      const toastId = generateToastId(id);

      if (status === 'submitted' && shouldShowPendingToast(id)) {
        showPendingToast(toastId);
      } else if (status === 'confirmed' && shouldShowTerminalToast(id)) {
        // Defer so the pending toast has at least one frame to render
        // before transitioning to success on fast transactions
        setTimeout(() => showSuccessToast(toastId), 0);
      } else if (failedStatuses.has(status) && shouldShowTerminalToast(id)) {
        setTimeout(() => showFailedToast(toastId), 0);
      }
    };

    // Non-EVM — submitted events
    const handleNonEvmSubmitted = (raw: Transaction | [Transaction]) => {
      const transaction = extractPayload(raw);
      if (!transaction?.id) {
        return;
      }
      if (shouldShowPendingToast(transaction.id)) {
        showPendingToast(generateToastId(transaction.id));
      }
    };

    // Non-EVM — confirmed events
    const handleNonEvmConfirmed = (raw: Transaction | [Transaction]) => {
      const transaction = extractPayload(raw);
      if (!transaction?.id) {
        return;
      }
      if (shouldShowTerminalToast(transaction.id)) {
        setTimeout(() => showSuccessToast(generateToastId(transaction.id)), 0);
      }
    };

    // Non-EVM unconfirmed/failed via AccountsController; MultichainTransactionsController omits these.
    const handleAccountsTxUpdated = (
      raw:
        | {
            transactions: Record<
              string,
              {
                id: string;
                status: string;
                type?: string;
                chain?: string;
                details?: { origin?: string };
              }[]
            >;
          }
        | [
            {
              transactions: Record<
                string,
                {
                  id: string;
                  status: string;
                  type?: string;
                  chain?: string;
                  details?: { origin?: string };
                }[]
              >;
            },
          ],
    ) => {
      const payload = extractPayload(raw);
      Object.values(payload?.transactions ?? {}).forEach((txs) => {
        txs.forEach((tx) => {
          if (!tx?.id || !tx?.status) {
            return;
          }
          if (tx.chain?.startsWith('eip155:')) {
            return;
          }

          const toastId = generateToastId(tx.id);

          if (tx.status === 'unconfirmed' && shouldShowPendingToast(tx.id)) {
            showPendingToast(toastId);
          } else if (tx.status === 'failed' && shouldShowTerminalToast(tx.id)) {
            setTimeout(() => showFailedToast(toastId), 0);
          }
        });
      });
    };

    messenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      handleEvmStatusUpdate,
    );
    messenger.subscribe(
      'MultichainTransactionsController:transactionSubmitted',
      handleNonEvmSubmitted,
    );
    messenger.subscribe(
      'MultichainTransactionsController:transactionConfirmed',
      handleNonEvmConfirmed,
    );
    messenger.subscribe(
      'AccountsController:accountTransactionsUpdated',
      handleAccountsTxUpdated,
    );

    return () => {
      messenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleEvmStatusUpdate,
      );
      messenger.unsubscribe(
        'MultichainTransactionsController:transactionSubmitted',
        handleNonEvmSubmitted,
      );
      messenger.unsubscribe(
        'MultichainTransactionsController:transactionConfirmed',
        handleNonEvmConfirmed,
      );
      messenger.unsubscribe(
        'AccountsController:accountTransactionsUpdated',
        handleAccountsTxUpdated,
      );
    };
  }, [messenger]);
}
