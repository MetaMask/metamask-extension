import {
  TransactionController,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import { RestrictedMessenger } from '@metamask/base-controller';
import InstitutionalWalletSnap from '@metamask/institutional-wallet-snap/dist/preinstalled-snap.json';
import { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';

const snapId = InstitutionalWalletSnap.snapId as SnapId;

type SnapRPCRequest = Parameters<HandleSnapRequest['handler']>[0];

// Todo: obtain this type from the snap package
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

export type InstitutionalSnapRequestSearchParameters = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};

type AllowedActions =
  | HandleSnapRequest
  | AccountsControllerGetAccountByAddressAction;

export type DeferredPublicationHookMessenger = RestrictedMessenger<
  'DeferredPublicationHookMessenger',
  AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

type DeferrableTransactionAccount = {
  options: {
    custodian: {
      deferPublication: boolean;
    };
  };
};

async function handleSnapRequest(
  controllerMessenger: DeferredPublicationHookMessenger,
  args: SnapRPCRequest,
) {
  const response = await controllerMessenger.call(
    'SnapController:handleRequest',
    args,
  );
  return response as InstitutionalSnapResponse;
}

async function shouldDeferPublication(
  controllerMessenger: DeferredPublicationHookMessenger,
  transactionMeta: TransactionMeta,
) {
  const account = controllerMessenger.call(
    'AccountsController:getAccountByAddress',
    transactionMeta.txParams.from as string,
  ) as unknown as DeferrableTransactionAccount;

  return account?.options.custodian?.deferPublication;
}

export const deferPublicationHookFactory = (
  getTransactionController: () => TransactionController,
  controllerMessenger: DeferredPublicationHookMessenger,
) => {
  return async function (transactionMeta: TransactionMeta): Promise<boolean> {
    const shouldDefer = await shouldDeferPublication(
      controllerMessenger,
      transactionMeta,
    );

    if (shouldDefer) {
      // Some transaction parameters are mutated by the custodian, for example
      // the gas and nonce parameters are set to the custodian's preference.
      // The snap is aware of these mutated parameters, so we need to fetch them
      // from the snap.
      // Because the snap is not aware of the MetaMask transaction ID, we need to
      // use the original transaction parameters to help the snap find the correct
      // transaction request

      const searchParams: InstitutionalSnapRequestSearchParameters = {
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
        controllerMessenger,
        snapGetMutableTransactionParamsPayload,
      );

      const hash = snapResponse.transaction.transactionHash;

      // Tell the transaction controller to update the transaction with the hash and mark as submitted, finishing the lifecycle and allowing
      // the block tracker to start watching for the transaction to be mined
      getTransactionController().updateCustodialTransaction(
        transactionMeta.id,
        {
          status: TransactionStatus.submitted,
          hash,
          nonce: snapResponse.transaction.nonce,
          gasLimit: snapResponse.transaction.gasLimit,
          maxFeePerGas: snapResponse.transaction.maxFeePerGas,
          maxPriorityFeePerGas: snapResponse.transaction.maxPriorityFeePerGas,
        },
      );
      return false;
    }
    return true;
  };
};

export const beforeCheckPendingTransactionHookFactory = (
  controllerMessenger: DeferredPublicationHookMessenger,
) => {
  return async function (transactionMeta: TransactionMeta) {
    const shouldDefer = await shouldDeferPublication(
      controllerMessenger,
      transactionMeta,
    );

    if (shouldDefer) {
      return false;
    }
    return true;
  };
};
