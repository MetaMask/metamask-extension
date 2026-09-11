import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { Hex } from 'viem';
import { TX_DETAILS_ROUTE } from '../../../../helpers/constants/routes';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import { useMessenger } from '../../../../hooks/useMessenger';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { defineAllowedRouteCapabilities } from '../../../../helpers/route-messenger-helpers';
import { isMoneyAccountTx } from '../../../../helpers/money/money-transaction-guards';
import type { RouteMessengerFromCapabilities } from '../../../../messengers/route-messenger';
import { toast, ToastContent } from '../../../ui/toast/toast';
import type { ToastStatus } from '../../toast-listener/shared';
import {
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from '../../toast-listener/toast-lifecycle';
import {
  useMoneyAccountToastLabel,
  type ToastLabel,
} from './useMoneyAccountToastLabel';

export const moneyAccountToastCapabilities = defineAllowedRouteCapabilities({
  actions: [],
  events: ['TransactionController:transactionStatusUpdated'],
});

type MoneyAccountToastMessenger = RouteMessengerFromCapabilities<
  typeof moneyAccountToastCapabilities
>;

const fallbackToastLabels: Record<ToastStatus, string> = {
  pending: 'transactionSubmitted',
  success: 'transactionConfirmed',
  failed: 'transactionFailed',
};

const toastTestIds: Record<ToastStatus, string> = {
  pending: 'money-account-toast-pending',
  success: 'money-account-toast-success',
  failed: 'money-account-toast-failed',
};

const pendingStatuses = new Set<string>([
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
]);

const failedStatuses = new Set<string>([
  TransactionStatus.failed,
  TransactionStatus.dropped,
  TransactionStatus.rejected,
  'cancelled',
]);

const generateToastId = (id: string) => `money-tx-${id}`;

function getDetailsRoute(chainId?: Hex, hash?: string) {
  if (!chainId || !hash) {
    return undefined;
  }
  return `${TX_DETAILS_ROUTE}/${toEvmCaipChainId(chainId)}/${hash}`;
}

type ContentProps = {
  toastId: string;
  status: ToastStatus;
  transactionId: string;
  to?: string;
};

const MoneyAccountToastContent = ({
  toastId,
  status,
  transactionId,
  to,
}: ContentProps) => {
  const t = useI18nContext();
  const label: ToastLabel = useMoneyAccountToastLabel(
    status,
    transactionId,
  ) ?? { title: t(fallbackToastLabels[status]) };

  return (
    <>
      <ToastContent
        title={label.title}
        description={label.description}
        dataTestId={toastTestIds[status]}
      />
      {to && (
        <Link
          to={to}
          aria-label={label.title}
          className="absolute inset-0 z-[1] cursor-pointer"
          onClick={() => toast.dismiss(toastId)}
        />
      )}
    </>
  );
};

function showMoneyAccountToast(
  status: ToastStatus,
  transactionMeta: TransactionMeta,
) {
  const { id, chainId, hash } = transactionMeta;
  const toastId = generateToastId(id);
  const content = (
    <MoneyAccountToastContent
      toastId={toastId}
      status={status}
      transactionId={id}
      to={getDetailsRoute(chainId, hash)}
    />
  );

  if (status === 'pending') {
    toast.loading(content, { id: toastId });
  } else if (status === 'success') {
    toast.success(content, { id: toastId });
  } else {
    toast.error(content, { id: toastId });
  }
}

/**
 * Trigger money account toasts from transaction lifecycle events.
 * The batches we watch are excluded from the generic transaction toasts
 */
export function useMoneyAccountToasts(): void {
  const messenger = useMessenger<MoneyAccountToastMessenger>();

  useEffect(() => {
    const handleStatusUpdated = (
      raw:
        | { transactionMeta: TransactionMeta }
        | [{ transactionMeta: TransactionMeta }],
    ) => {
      const { transactionMeta } = Array.isArray(raw) ? raw[0] : raw;
      if (!transactionMeta?.id || !transactionMeta.status) {
        return;
      }
      if (!isMoneyAccountTx(transactionMeta)) {
        return;
      }

      const { id, status } = transactionMeta;

      if (pendingStatuses.has(status)) {
        if (shouldShowPendingToast(id)) {
          showMoneyAccountToast('pending', transactionMeta);
        }
      } else if (
        status === TransactionStatus.confirmed &&
        shouldShowTerminalToast(id)
      ) {
        showMoneyAccountToast('success', transactionMeta);
      } else if (failedStatuses.has(status) && shouldShowTerminalToast(id)) {
        showMoneyAccountToast('failed', transactionMeta);
      }
    };

    messenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      handleStatusUpdated,
    );

    return () => {
      messenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleStatusUpdated,
      );
    };
  }, [messenger]);
}

const MoneyAccountToastListenerInner = () => {
  useMoneyAccountToasts();
  return null;
};

export function MoneyAccountToastListener() {
  return (
    <RouteMessengerProvider
      path="money-account-toast-listener"
      capabilities={moneyAccountToastCapabilities}
    >
      <MoneyAccountToastListenerInner />
    </RouteMessengerProvider>
  );
}
