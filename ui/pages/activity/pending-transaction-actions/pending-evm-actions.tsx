import React, { useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { EditGasModes } from '../../../../shared/constants/gas';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { PendingTransactionActionButtons } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-action-buttons';
import type { MetaMaskReduxState } from '../../../store/store';
import {
  selectTransactionById,
  selectTransactions,
} from '../../../selectors/transactionController';
import { isIntentBridgeActivity } from '../../../helpers/transactions/pending-transaction-actions';
import { useBridgeTxHistoryData } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { buildTransactionGroupFromMeta } from './build-transaction-group-from-meta';

type TransactionMetaWithSmartTransaction = TransactionMeta & {
  isSmartTransaction?: boolean;
};

type PendingEvmActionsProps = {
  metaId: string;
  isEarliestNonce: boolean;
  setEditGasMode: (mode: EditGasModes) => void;
  onGasModalMetaId: (metaId: string) => void;
};

type PendingTransactionActionButtonsWrapperProps = {
  meta: TransactionMeta;
  transactionGroup: TransactionGroup;
  isEarliestNonce: boolean;
  setEditGasMode: (mode: EditGasModes) => void;
  onGasModalMetaId: (metaId: string) => void;
};

const PendingTransactionActionButtonsWrapper = ({
  meta,
  transactionGroup,
  isEarliestNonce,
  setEditGasMode,
  onGasModalMetaId,
}: Readonly<PendingTransactionActionButtonsWrapperProps>) => {
  const { bridgeHistoryItem } = useBridgeTxHistoryData({ transactionGroup });

  const { showCancel, onCancel, speedUp } = usePendingTransactionActions({
    transactionGroup,
    isEarliestNonce,
    setEditGasMode,
    hasIntentBridgeActivity: isIntentBridgeActivity(bridgeHistoryItem),
  });

  const wrapHandler =
    (handler: (event: ReactMouseEvent) => void) => (event: ReactMouseEvent) => {
      onGasModalMetaId(meta.id);
      handler(event);
    };

  return (
    <PendingTransactionActionButtons
      showCancel={showCancel}
      onCancel={wrapHandler(onCancel)}
      speedUp={{
        ...speedUp,
        onClick: wrapHandler(speedUp.onClick),
      }}
      primaryTransaction={meta}
    />
  );
};

/**
 * Activity v3 adapter for pending cancel / speed-up controls.
 * Resolves meta from Redux, rebuilds nonce group for visibility rules, wires
 * `usePendingTransactionActions` to decide visibility of action buttons.
 *
 * @param options - Pending action inputs for the activity row.
 * @param options.metaId - TransactionController meta id for the row.
 * @param options.isEarliestNonce - Whether this meta has the earliest pending nonce on its chain.
 * @param options.setEditGasMode - Sets cancel vs speed-up mode before opening the gas modal.
 * @param options.onGasModalMetaId - Records which meta the gas modal should target.
 */
export const PendingEvmActions = ({
  metaId,
  isEarliestNonce,
  setEditGasMode,
  onGasModalMetaId,
}: Readonly<PendingEvmActionsProps>) => {
  const meta = useSelector((state: MetaMaskReduxState) =>
    selectTransactionById(state, metaId),
  );
  const transactions = useSelector(selectTransactions);

  const transactionGroup = useMemo(() => {
    if (!meta) {
      return undefined;
    }
    return buildTransactionGroupFromMeta(meta, transactions);
  }, [meta, transactions]);

  if (
    !meta ||
    (meta as TransactionMetaWithSmartTransaction).isSmartTransaction ||
    !transactionGroup
  ) {
    return null;
  }

  return (
    <PendingTransactionActionButtonsWrapper
      meta={meta}
      transactionGroup={transactionGroup}
      isEarliestNonce={isEarliestNonce}
      setEditGasMode={setEditGasMode}
      onGasModalMetaId={onGasModalMetaId}
    />
  );
};
