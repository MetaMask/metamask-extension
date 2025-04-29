import { TransactionMeta } from '@metamask/transaction-controller';
import { JsonRpcError, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import {
  disableAccountUpgradeForChain,
  rejectPendingApproval,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { EIP5792ErrorCode } from '../../../../shared/constants/transaction';

export function useSmartAccountActions() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { id: confirmationId, chainId } = currentConfirmation ?? {};

  const handleRejectUpgrade = useCallback(async () => {
    const error = new JsonRpcError(
      EIP5792ErrorCode.RejectedUpgrade,
      'User rejected account upgrade',
    );
    const serializedError = serializeError(error);

    await disableAccountUpgradeForChain(chainId as string);

    dispatch(rejectPendingApproval(confirmationId, serializedError));
  }, [dispatch, confirmationId, chainId]);

  return { handleRejectUpgrade };
}
