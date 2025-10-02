import type { AddEthereumChainParameter } from 'viem';
import { ApprovalType } from '@metamask/controller-utils';

type RequestDataExtensions = {
  ticker: string;
  rpcUrl: string;
  failoverRpcUrls?: string[];
  rpcPrefs: {
    blockExplorerUrl?: string;
  };
};

export type AddEthereumChainContext = {
  id: string;
  origin: string;
  type: ApprovalType.AddEthereumChain;
  requestData: AddEthereumChainParameter & RequestDataExtensions;
};
