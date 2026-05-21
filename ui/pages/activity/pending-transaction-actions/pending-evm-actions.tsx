import React, { useMemo, type MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { EditGasModes } from '../../../../shared/constants/gas';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { PendingTransactionActionButtons } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-action-buttons';
import type { MetaMaskReduxState } from '../../../store/store';
import { selectTransactionById, selectTransactions } from '../../../selectors/transactionController';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { buildTransactionGroupFromMeta } from './build-transaction-group-from-meta';

const buildInactiveTransactionGroup = (): TransactionGroup => {
  const inactiveMeta = {
    id: 'inactive',
    status: TransactionStatus.confirmed,
    chainId: '0x1',
    txParams: { nonce: '0x0' },
  } as TransactionMeta;

  return {
    transactions: [inactiveMeta],
    initialTransaction: inactiveMeta,
    primaryTransaction: inactiveMeta,
    nonce: '0x0' as Hex,
    hasCancelled: false,
    hasRetried: false,
  };
}

type PendingEvmActionsProps = {
  metaId: string;
  isEarliestNonce: boolean;
  setEditGasMode: (mode: EditGasModes) => void;
  onGasModalMetaId: (metaId: string) => void;
};

/**
 * Activity v3 adapter for pending cancel / speed-up controls.
 * Resolves meta from Redux, rebuilds the nonce group for visibility
 * rules, wires `usePendingTransactionActions`, and sets `onGasModalMetaId` before
 * delegating render to `PendingTransactionActionButtons`.
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

  const inactiveGroup = useMemo(buildInactiveTransactionGroup, []);

  const actions = usePendingTransactionActions({
    transactionGroup: transactionGroup ?? inactiveGroup,
    isEarliestNonce,
    setEditGasMode,
  });

  if (!meta || meta.isSmartTransaction || !transactionGroup) {
    return null;
  }

  if (!actions.showCancel && !actions.showSpeedUp) {
    return null;
  }

  const wrapHandler =
    (handler: (event: MouseEvent) => void) => (event: MouseEvent) => {
      onGasModalMetaId(meta.id);
      handler(event);
    };

  return (
    <PendingTransactionActionButtons
      showCancel={actions.showCancel}
      showSpeedUp={actions.showSpeedUp}
      speedUpLabel={actions.speedUpLabel}
      onCancel={wrapHandler(actions.onCancel)}
      onSpeedUp={wrapHandler(actions.onSpeedUp)}
      primaryTransaction={meta}
    />
  );
}
