import {
  useCallback,
  useContext,
  type MouseEvent as ReactMouseEvent,
} from 'react';
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
 * Speed up / cancel click handlers for pending EVM activity rows.
 *
 * @param options - Handler inputs for the row's primary transaction.
 * @param options.primaryTransaction - Primary transaction meta for cancel / speed-up.
 * @param options.setEditGasMode - Sets cancel vs speed-up mode before opening the gas modal.
 */
export const usePendingTransactionCancelSpeedUpHandlers = ({
  primaryTransaction,
  setEditGasMode,
}: UsePendingTransactionCancelSpeedUpHandlersParams) => {
  const { openModal } = useTransactionModalContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { id, status } = primaryTransaction;

  const onSpeedUp = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Speed Up"',
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          action: 'Activity Log',
          // eslint-disable-next-line @typescript-eslint/naming-convention -- legacy metrics field
          legacy_event: true,
        },
      });
      setEditGasMode(EditGasModes.speedUp);
      openModal('cancelSpeedUpTransaction');
    },
    [openModal, setEditGasMode, trackEvent],
  );

  const onCancel = useCallback(
    (event: ReactMouseEvent) => {
      event.stopPropagation();
      trackEvent({
        event: 'Clicked "Cancel"',
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          action: 'Activity Log',
          // eslint-disable-next-line @typescript-eslint/naming-convention -- legacy metrics field
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
};
