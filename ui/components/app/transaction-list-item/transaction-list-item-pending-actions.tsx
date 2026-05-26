import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Button, ButtonSize } from '@metamask/design-system-react';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { EditGasModes } from '../../../../shared/constants/gas';
import CancelButton from '../cancel-button';
import {
  TransactionModalContextProvider,
  useTransactionModalContext,
} from '../../../contexts/transaction-modal';
import { abortTransactionSigning } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isTransactionEarliestNonce } from '../../../hooks/useEarliestNonceByChain';
import { useShouldShowSpeedUp } from '../../../hooks/useShouldShowSpeedUp';
import { CancelSpeedup } from '../../../pages/confirmations/cancel-speedup/cancel-speedup';

type TransactionListItemPendingActionsProps = {
  transactionGroup: TransactionGroup;
  earliestNonceByChain: Record<string, number>;
};

type TransactionListItemPendingActionButtonsProps =
  TransactionListItemPendingActionsProps & {
    setEditGasMode: (mode: EditGasModes) => void;
  };

const TransactionListItemPendingActionButtons = ({
  transactionGroup,
  earliestNonceByChain,
  setEditGasMode,
}: TransactionListItemPendingActionButtonsProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { openModal } = useTransactionModalContext();
  const { hasCancelled, nonce, primaryTransaction, initialTransaction } =
    transactionGroup;
  const { id, status, selectedGasFeeToken } = primaryTransaction;
  const isPending = [
    TransactionStatus.submitted,
    TransactionStatus.approved,
    TransactionStatus.signed,
  ].includes(status);
  const isUnapproved = status === TransactionStatus.unapproved;
  const isSubmitting = status === TransactionStatus.signed;
  const isSigning = status === TransactionStatus.approved;
  const hasGasFeeTokenSelected = Boolean(selectedGasFeeToken);
  const isBridgeTx = initialTransaction.type === TransactionType.bridge;
  const isEarliestNonce = isTransactionEarliestNonce(
    nonce,
    initialTransaction.chainId,
    earliestNonceByChain,
  );
  const shouldShowSpeedUp = useShouldShowSpeedUp(
    transactionGroup,
    isEarliestNonce,
  );

  const openCancelSpeedupModal = useCallback(
    (mode: EditGasModes) => {
      setEditGasMode(mode);
      openModal('cancelSpeedUpTransaction');
    },
    [openModal, setEditGasMode],
  );

  const retryTransaction = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      openCancelSpeedupModal(EditGasModes.speedUp);
    },
    [openCancelSpeedupModal],
  );

  const cancelTransaction = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (status === TransactionStatus.approved) {
        dispatch(abortTransactionSigning(id));
        return;
      }

      openCancelSpeedupModal(EditGasModes.cancel);
    },
    [dispatch, id, openCancelSpeedupModal, status],
  );

  const showSpeedUpButton =
    shouldShowSpeedUp &&
    isPending &&
    !isUnapproved &&
    !isSigning &&
    !isSubmitting &&
    !hasGasFeeTokenSelected;
  const showCancelButton =
    !hasCancelled &&
    isPending &&
    !isUnapproved &&
    !isSubmitting &&
    !isBridgeTx &&
    !hasGasFeeTokenSelected;

  if (!showCancelButton && !showSpeedUpButton) {
    return null;
  }

  return (
    <div className="flex gap-2 px-4 pb-3">
      {showCancelButton ? (
        <CancelButton
          size={ButtonSize.Sm}
          transaction={primaryTransaction}
          cancelTransaction={cancelTransaction}
        />
      ) : null}
      {showSpeedUpButton ? (
        <Button
          className="whitespace-nowrap"
          data-testid="speed-up-button"
          size={ButtonSize.Sm}
          onClick={hasCancelled ? cancelTransaction : retryTransaction}
        >
          {hasCancelled ? t('speedUpCancellation') : t('speedUp')}
        </Button>
      ) : null}
    </div>
  );
};

export const TransactionListItemPendingActions = ({
  transactionGroup,
  earliestNonceByChain,
}: TransactionListItemPendingActionsProps) => {
  const [editGasMode, setEditGasMode] = useState(EditGasModes.cancel);

  return (
    <TransactionModalContextProvider>
      <TransactionListItemPendingActionButtons
        transactionGroup={transactionGroup}
        earliestNonceByChain={earliestNonceByChain}
        setEditGasMode={setEditGasMode}
      />
      <CancelSpeedup
        transaction={transactionGroup.primaryTransaction}
        editGasMode={editGasMode}
      />
    </TransactionModalContextProvider>
  );
};
