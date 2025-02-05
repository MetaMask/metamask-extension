import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import { accountRequiresPublicationDeferral } from '../../../../../shared/modules/selectors';

import { MetaMaskState } from '../../../controllers/metametrics-controller';

const snapId = 'local:http://localhost:8080' as SnapId;

type SnapRPCRequest = Parameters<HandleSnapRequest['handler']>[0];

type updateTransactionMethod = (
  transactionId: string,
  params: {
    status: TransactionStatus;
    hash: string;
    nonce: string;
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  },
) => void;

export type InstitutionalSnapResponse = {
  keyringRequest: {
    id: string;
    scope: string;
    account: string;
    request: {
      method: string;
      params: [
        {
          chainId: string;
          nonce: string;
          maxPriorityFeePerGas: string;
          maxFeePerGas: string;
          gasLimit: string;
          to: string;
          value: string;
          data: string;
          accessList: string[];
          from: string;
          type: string;
        },
      ];
    };
  };
  type: string;
  fulfilled: boolean;
  rejected: boolean;
  lastUpdated: number;
  transaction: {
    custodianTransactionId: string;
    transactionStatus: {
      finished: boolean;
      success: boolean;
      displayText: string;
      submitted: boolean;
      reason: string;
      signed: boolean;
    };
    from: string;
    custodianPublishesTransaction: boolean;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    gasLimit: string;
    nonce: string;
    to: string;
    transactionHash: string;
  };
  result: {
    v: string;
    r: string;
    s: string;
  };
};

export type MutableTransactionSearchParams = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};

export const deferPublicationHookFactory = (
  updateTransaction: updateTransactionMethod,
  handleSnapRequest: (
    payload: SnapRPCRequest,
  ) => Promise<InstitutionalSnapResponse>,
  getMetaMaskState: () => MetaMaskState,
) => {
  return async function (transactionMeta: TransactionMeta) {
    const state = getMetaMaskState();
    const shouldDeferPublication = accountRequiresPublicationDeferral(
      state,
      transactionMeta.txParams.from,
    );

    if (shouldDeferPublication) {
      // Some transaction parameters are mutated by the custodian, for example
      // the gas and nonce parameters are set to the custodian's preference.
      // The snap is aware of these mutated parameters, so we need to fetch them
      // from the snap.
      // Because the snap is not aware of the MetaMask transaction ID, we need to
      // use the original transaction parameters to help the snap find the correct
      // transaction request

      const searchParams: MutableTransactionSearchParams = {
        from: transactionMeta.txParams.from as string,
        to: transactionMeta.txParams.to as string,
        value: transactionMeta.txParams.value as string,
        data: transactionMeta.txParams.data as string,
        chainId: transactionMeta.chainId as string,
      };

      const snapGetMutableTransactionParamsPayload: SnapRPCRequest = {
        snapId,
        origin: 'metamask',
        handler: HandlerType.OnRpcRequest,
        request: {
          method: 'transactions.getMutableTransactionParameters',
          params: searchParams,
        },
      };

      const snapResponse = await handleSnapRequest(
        snapGetMutableTransactionParamsPayload,
      );

      const hash = snapResponse.transaction.transactionHash;

      // Tell the transaction controller to update the transaction with the hash and mark as submitted, finishing the lifecycle and allowing
      // the block tracker to start watching for the transaction to be mined
      updateTransaction(transactionMeta.id, {
        status: TransactionStatus.submitted,
        hash,
        nonce: snapResponse.transaction.nonce,
        gasLimit: snapResponse.transaction.gasLimit,
        maxFeePerGas: snapResponse.transaction.maxFeePerGas,
        maxPriorityFeePerGas: snapResponse.transaction.maxPriorityFeePerGas,
      });
      return false;
    }
    return true;
  };
};

export const beforeCheckPendingTransactionHookFactory = (
  getMetaMaskState: () => any,
) => {
  return function (transactionMeta: TransactionMeta) {
    const state = getMetaMaskState();
    const shouldDeferPublication = accountRequiresPublicationDeferral(
      state,
      transactionMeta.txParams.from,
    );

    if (shouldDeferPublication) {
      return false;
    }
    return true;
  };
};
