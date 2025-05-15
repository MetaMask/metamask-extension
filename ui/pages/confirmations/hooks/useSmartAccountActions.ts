import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { rejectPendingApproval } from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';

export function useSmartAccountActions() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: confirmationId, chainId, txParams } = currentConfirmation ?? {};
  const { from } = txParams ?? {};

  const handleRejectUpgrade = useCallback(async () => {
    if (!chainId || !from) {
      return;
    }

    const error = providerErrors.userRejectedRequest();

    const serializedError = serializeError(error);

    dispatch(rejectPendingApproval(confirmationId, serializedError));
  }, [dispatch, confirmationId, chainId, from]);

  return { handleRejectUpgrade };
}
