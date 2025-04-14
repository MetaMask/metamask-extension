import { Hex } from '@metamask/utils';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { getTransactions } from '../../../selectors';

export type EIP7702NetworkConfiguration = MultichainNetworkConfiguration & {
  chainIdHex: Hex;
  isSupported: boolean;
  upgradeContractAddress?: Hex;
};

export const useBatchAuthorizationRequests = (from: Hex, chainId: Hex) => {
  const transactions = useSelector(getTransactions);

  const submittedRequestsOfChain = transactions.filter(
    (transaction: TransactionMeta) => {
      return (
        transaction.chainId === chainId &&
        transaction.status === TransactionStatus.submitted &&
        (transaction.txParams.authorizationList?.length ?? 0) > 0 &&
        transaction.txParams.from === from
      );
    },
  );

  return { hasPendingRequests: submittedRequestsOfChain.length > 0 };
};
