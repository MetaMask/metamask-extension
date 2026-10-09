import React, { useEffect } from 'react';
import { useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { Hex } from 'viem';
import { TX_DETAILS_ROUTE } from '../../../../helpers/constants/routes';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import { useMessenger } from '../../../../hooks/useMessenger';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { defineAllowedRouteCapabilities } from '../../../../helpers/route-messenger-helpers';
import {
  isMoneyAccountTx,
  isMoneyDepositTx,
} from '../../../../helpers/money/money-transaction-guards';
import {
  clearMoneyAccountDepositIntent,
  getMoneyAccountDepositIntent,
  type MoneyAccountDepositIntent,
} from '../../../../helpers/money/deposit-intent';
import {
  clearMoneyBatchTransaction,
  registerMoneyBatchTransaction,
} from '../../../../helpers/money/money-batch-registry';
import type { RouteMessengerFromCapabilities } from '../../../../messengers/route-messenger';
import type { MetaMaskReduxState } from '../../../../store/store';
import { haveRequiredTransactionsBeenSigned } from '../../../../store/hardware-wallet-signing';
import { getInternalAccountByAddress } from '../../../../selectors/accounts';
import {
  selectBatchTransactionCounts,
  selectTransactions,
} from '../../../../selectors/transactionController';
import {
  selectTransactionDataByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { isHardwareAccount } from '../../rewards/utils/isHardwareAccount';
import { toast, ToastContent } from '../../../ui/toast/toast';
import type { ToastStatus } from '../../toast-listener/shared';
import {
  clearToastPhase,
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

const signedStatuses = new Set<string>([
  TransactionStatus.signed,
  TransactionStatus.submitted,
  TransactionStatus.confirmed,
]);

const generateToastId = (id: string) => `money-tx-${id}`;

function withTransaction(
  transactions: TransactionMeta[],
  transactionMeta: TransactionMeta,
) {
  return [
    ...transactions.filter(({ id }) => id !== transactionMeta.id),
    transactionMeta,
  ];
}

/**
 * Whether an approved deposit still waits for its hardware wallet payer to
 * sign the funding transactions.
 *
 * @param deposit - Money Account deposit transaction.
 * @param state - Redux state.
 * @param transactions - Transactions including the latest event payload.
 */
function isAwaitingHardwareSignatures(
  deposit: TransactionMeta,
  state: MetaMaskReduxState,
  transactions: TransactionMeta[],
) {
  if (
    deposit.status !== TransactionStatus.approved ||
    !isMoneyDepositTx(deposit)
  ) {
    return false;
  }

  const transactionData = selectTransactionDataByTransactionId(
    state as unknown as TransactionPayState,
    deposit.id,
  );

  if (
    deposit.metamaskPay?.fiat ||
    transactionData?.fiatPayment?.selectedPaymentMethodId
  ) {
    return false;
  }

  const payer = getInternalAccountByAddress(
    state,
    transactionData?.accountOverride ?? deposit.txParams.from,
  );

  if (!payer || !isHardwareAccount(payer)) {
    return false;
  }

  return !haveRequiredTransactionsBeenSigned(
    deposit.id,
    {
      transactions,
      batchTransactionCounts: selectBatchTransactionCounts(state),
    },
    Math.max(transactionData?.quotes?.length ?? 0, 1),
  );
}

function isSpeedUpReplacement(
  replacedById: string,
  transactions: TransactionMeta[],
) {
  const replacement = transactions.find((tx) => tx.id === replacedById);
  return replacement?.type !== TransactionType.cancel;
}

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
  recordedIntent?: MoneyAccountDepositIntent;
  to?: string;
};

const MoneyAccountToastContent = ({
  toastId,
  status,
  transactionId,
  recordedIntent,
  to,
}: ContentProps) => {
  const t = useI18nContext();
  const label: ToastLabel = useMoneyAccountToastLabel(
    status,
    transactionId,
    recordedIntent,
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
  const { id, chainId, hash, batchId } = transactionMeta;
  const toastId = generateToastId(id);
  const recordedIntent = getMoneyAccountDepositIntent(batchId);
  if (status !== 'pending') {
    clearMoneyAccountDepositIntent(batchId);
  }
  const content = (
    <MoneyAccountToastContent
      toastId={toastId}
      status={status}
      transactionId={id}
      recordedIntent={recordedIntent}
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
  const store = useStore<MetaMaskReduxState>();

  useEffect(() => {
    const handleFundingTransactionSigned = (
      fundingTransaction: TransactionMeta,
    ) => {
      const state = store.getState();
      const transactions = withTransaction(
        selectTransactions(state),
        fundingTransaction,
      );
      const deposit = transactions.find(
        (tx) =>
          tx.requiredTransactionIds?.includes(fundingTransaction.id) &&
          isMoneyDepositTx(tx),
      );

      if (
        !deposit ||
        !pendingStatuses.has(deposit.status) ||
        isAwaitingHardwareSignatures(deposit, state, transactions) ||
        !shouldShowPendingToast(deposit.id)
      ) {
        return;
      }

      showMoneyAccountToast('pending', deposit);
    };

    const handleStatusUpdated = (
      raw:
        | { transactionMeta: TransactionMeta }
        | [{ transactionMeta: TransactionMeta }],
    ) => {
      const { transactionMeta } = Array.isArray(raw) ? raw[0] : raw;
      if (!transactionMeta?.id || !transactionMeta.status) {
        return;
      }

      const { id, status, replacedById } = transactionMeta;

      if (!isMoneyAccountTx(transactionMeta)) {
        if (signedStatuses.has(status)) {
          handleFundingTransactionSigned(transactionMeta);
        }
        return;
      }

      if (pendingStatuses.has(status)) {
        registerMoneyBatchTransaction(transactionMeta);
        const state = store.getState();
        if (
          !isAwaitingHardwareSignatures(
            transactionMeta,
            state,
            withTransaction(selectTransactions(state), transactionMeta),
          ) &&
          shouldShowPendingToast(id)
        ) {
          showMoneyAccountToast('pending', transactionMeta);
        }
      } else if (status === TransactionStatus.confirmed) {
        clearMoneyBatchTransaction(transactionMeta);
        if (shouldShowTerminalToast(id)) {
          showMoneyAccountToast('success', transactionMeta);
        }
      } else if (failedStatuses.has(status)) {
        clearMoneyBatchTransaction(transactionMeta);
        if (
          replacedById &&
          isSpeedUpReplacement(
            replacedById,
            selectTransactions(store.getState()),
          )
        ) {
          toast.dismiss(generateToastId(id));
          clearToastPhase(id);
        } else if (shouldShowTerminalToast(id)) {
          showMoneyAccountToast('failed', transactionMeta);
        }
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
  }, [messenger, store]);
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
