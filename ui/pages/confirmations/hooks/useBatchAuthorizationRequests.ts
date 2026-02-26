import { Hex } from '@metamask/utils';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { getTransactions } from '../../../selectors';
import { IN_PROGRESS_TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';

export type EIP7702NetworkConfiguration = MultichainNetworkConfiguration & {
  chainIdHex: Hex;
  isSupported: boolean;
  upgradeContractAddress?: Hex;
};

export const useBatchAuthorizationRequests = (from: Hex, chainId: Hex) => {
  const transactions = useSelector(getTransactions);

  const pendingRequestsOfChain = transactions.filter(
    (transaction: TransactionMeta) => {
      return (
        transaction.chainId === chainId &&
        IN_PROGRESS_TRANSACTION_STATUSES.includes(transaction.status) &&
        (transaction.txParams.authorizationList?.length ?? 0) > 0 &&
        transaction.txParams.from === from
      );
    },
  );

  return { hasPendingRequests: pendingRequestsOfChain.length > 0 };
};
