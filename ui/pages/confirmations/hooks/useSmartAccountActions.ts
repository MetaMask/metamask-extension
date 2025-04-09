import { TransactionMeta } from '@metamask/transaction-controller';
import { rpcErrors, serializeError } from '@metamask/rpc-errors';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import {
  disableAccountUpgradeForChainAndAddress,
  rejectPendingApproval,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';

export function useSmartAccountActions() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    id: confirmationId,
    chainId,
    txParams: { from },
  } = currentConfirmation ?? {};

  const handleRejectUpgrade = useCallback(async () => {
    const error = rpcErrors.methodNotSupported('User rejected account upgrade');
    const serializedError = serializeError(error);

    await disableAccountUpgradeForChainAndAddress(chainId as string, from);

    dispatch(rejectPendingApproval(confirmationId, serializedError));
  }, [dispatch, confirmationId, chainId]);

  return { handleRejectUpgrade };
}
