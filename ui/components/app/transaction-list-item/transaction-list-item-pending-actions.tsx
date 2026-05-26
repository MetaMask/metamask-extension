import React, { useState } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { EditGasModes } from '../../../../shared/constants/gas';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import { isIntentBridgeActivity } from '../../../helpers/transactions/pending-transaction-actions';
import { useBridgeTxHistoryData } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { isTransactionEarliestNonce } from '../../../hooks/useEarliestNonceByChain';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { CancelSpeedup } from '../../../pages/confirmations/cancel-speedup/cancel-speedup';
import { PendingTransactionActionButtons } from '../pending-transaction-action-buttons/pending-transaction-action-buttons';

type TransactionMetaWithSmartTransaction = TransactionMeta & {
  isSmartTransaction?: boolean;
};

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
  const { nonce, primaryTransaction, initialTransaction } = transactionGroup;
  const isEarliestNonce = isTransactionEarliestNonce(
    nonce,
    initialTransaction.chainId,
    earliestNonceByChain,
  );
  const { bridgeHistoryItem } = useBridgeTxHistoryData({ transactionGroup });
  const { showCancel, onCancel, speedUp } = usePendingTransactionActions({
    transactionGroup,
    isEarliestNonce,
    setEditGasMode,
    hasIntentBridgeActivity: isIntentBridgeActivity(bridgeHistoryItem),
  });

  if (
    initialTransaction.isSmartTransaction ||
    (primaryTransaction as TransactionMetaWithSmartTransaction)
      .isSmartTransaction
  ) {
    return null;
  }

  if (!showCancel && !speedUp.show) {
    return null;
  }

  return (
    <div className="px-4 pb-3">
      <PendingTransactionActionButtons
        showCancel={showCancel}
        onCancel={onCancel}
        speedUp={speedUp}
        primaryTransaction={primaryTransaction}
      />
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
