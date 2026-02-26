import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { resolvePendingApproval } from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import type { AddEthereumChainContext } from '../external/add-ethereum-chain/types';

// Ported from templates/add-ethereum-chain.js
export const useAddEthereumChain = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { currentConfirmation } = useConfirmContext<AddEthereumChainContext>();
  const { id, origin, requestData } = currentConfirmation ?? {};

  const onSubmit = useCallback(async () => {
    await dispatch(resolvePendingApproval(id, requestData));
  }, [id, origin, requestData, dispatch]);

  return {
    onSubmit,
  };
};

export function isAddEthereumChainType(
  confirmation: TransactionMeta | AddEthereumChainContext | null,
): confirmation is AddEthereumChainContext {
  return confirmation?.type === ApprovalType.AddEthereumChain;
}
