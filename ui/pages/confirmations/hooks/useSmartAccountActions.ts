import { TransactionMeta } from '@metamask/transaction-controller';
import { JsonRpcError, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { rejectPendingApproval } from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { EIP5792ErrorCode } from '../../../../shared/constants/transaction';

export function useSmartAccountActions() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: confirmationId, chainId, txParams } = currentConfirmation ?? {};
  const { from } = txParams ?? {};

  const handleRejectUpgrade = useCallback(async () => {
    if (!chainId || !from) {
      return;
    }

    const error = new JsonRpcError(
      EIP5792ErrorCode.RejectedUpgrade,
      'User rejected account upgrade',
    );

    const serializedError = serializeError(error);

    dispatch(rejectPendingApproval(confirmationId, serializedError));
  }, [dispatch, confirmationId, chainId, from]);

  return { handleRejectUpgrade };
}
