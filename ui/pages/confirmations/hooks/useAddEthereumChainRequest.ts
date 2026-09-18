import { ApprovalType } from '@metamask/controller-utils';

import { AddEthereumChainContext } from '../external/add-ethereum-chain/types';
import { useApprovalRequest } from './useApprovalRequest';

export function useAddEthereumChainRequest():
  | AddEthereumChainContext
  | undefined {
  const pendingApproval = useApprovalRequest();

  if (pendingApproval?.type !== ApprovalType.AddEthereumChain) {
    return undefined;
  }

  return pendingApproval as unknown as AddEthereumChainContext;
}
