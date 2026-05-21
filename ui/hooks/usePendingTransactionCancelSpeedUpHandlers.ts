import { useCallback, useContext, type MouseEvent } from 'react';
import { useDispatch } from 'react-redux';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { EditGasModes } from '../../shared/constants/gas';
import { MetaMetricsEventCategory } from '../../shared/constants/metametrics';
import { useTransactionModalContext } from '../contexts/transaction-modal';
import { MetaMetricsContext } from '../contexts/metametrics';
import { abortTransactionSigning } from '../store/actions';

type UsePendingTransactionCancelSpeedUpHandlersParams = {
  primaryTransaction: TransactionMeta;
  setEditGasMode: (mode: EditGasModes) => void;
};

/**
 * Speed up / cancel click handlers for pending activity rows (opens gas modal or
 * aborts hardware signing).
 */
export function usePendingTransactionCancelSpeedUpHandlers({
  primaryTransaction,
  setEditGasMode,
}: UsePendingTransactionCancelSpeedUpHandlersParams) {
  const { openModal } = useTransactionModalContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { id, status } = primaryTransaction;

  const onSpeedUp = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Speed Up"',
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          action: 'Activity Log',
          legacy_event: true,
        },
      });
      setEditGasMode(EditGasModes.speedUp);
      openModal('cancelSpeedUpTransaction');
    },
    [openModal, setEditGasMode, trackEvent],
  );

  const onCancel = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Cancel"',
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          action: 'Activity Log',
          legacy_event: true,
        },
      });
      if (status === TransactionStatus.approved) {
        dispatch(abortTransactionSigning(id));
      } else {
        setEditGasMode(EditGasModes.cancel);
        openModal('cancelSpeedUpTransaction');
      }
    },
    [trackEvent, openModal, setEditGasMode, status, dispatch, id],
  );

  return { onSpeedUp, onCancel };
}
