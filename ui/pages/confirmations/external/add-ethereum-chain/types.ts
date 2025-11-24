import type { AddEthereumChainParameter } from 'viem';
import { ApprovalType } from '@metamask/controller-utils';

export type AddEthereumChainContext = {
  id: string;
  origin: string;
  type: ApprovalType.AddEthereumChain;
  requestData: AddEthereumChainParameter & {
    ticker: string;
    rpcUrl: string;
    failoverRpcUrls?: string[];
    rpcPrefs: {
      blockExplorerUrl?: string;
    };
  };
};
