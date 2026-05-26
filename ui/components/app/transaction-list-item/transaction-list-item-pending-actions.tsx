import React, { type MouseEvent as ReactMouseEvent } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { EditGasModes } from '../../../../shared/constants/gas';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { isIntentBridgeActivity } from '../../../helpers/transactions/pending-transaction-actions';
import { useBridgeTxHistoryData } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { isTransactionEarliestNonce } from '../../../hooks/useEarliestNonceByChain';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { PendingTransactionActionButtons } from '../pending-transaction-action-buttons/pending-transaction-action-buttons';

type TransactionMetaWithSmartTransaction = TransactionMeta & {
  isSmartTransaction?: boolean;
};

type TransactionListItemPendingActionsProps = {
  transactionGroup: TransactionGroup;
  earliestNonceByChain: Record<string, number>;
  setEditGasMode: (mode: EditGasModes) => void;
  onGasModalMetaId: (metaId: string) => void;
};

export const TransactionListItemPendingActions = ({
  transactionGroup,
  earliestNonceByChain,
  setEditGasMode,
  onGasModalMetaId,
}: Readonly<TransactionListItemPendingActionsProps>) => {
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

  const wrapHandler =
    (handler: (event: ReactMouseEvent) => void) => (event: ReactMouseEvent) => {
      onGasModalMetaId(primaryTransaction.id);
      handler(event);
    };

  return (
    <div className="px-4 pb-3">
      <PendingTransactionActionButtons
        showCancel={showCancel}
        onCancel={wrapHandler(onCancel)}
        speedUp={{
          ...speedUp,
          onClick: wrapHandler(speedUp.onClick),
        }}
        primaryTransaction={primaryTransaction}
      />
    </div>
  );
};
