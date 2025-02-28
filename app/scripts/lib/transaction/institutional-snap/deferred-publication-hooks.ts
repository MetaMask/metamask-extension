import {
  TransactionController,
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import { BaseController, RestrictedMessenger } from '@metamask/base-controller';
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
    type: string;
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

type DeferredPublicationControllerState = Record<string, never>;

const metadata = {};

export class DeferredPublicationController extends BaseController<
  'DeferredPublicationController',
  DeferredPublicationControllerState,
  DeferredPublicationHookMessenger
> {
  constructor({ messenger }: { messenger: DeferredPublicationHookMessenger }) {
    super({
      messenger,
      name: 'DeferredPublicationController',
      state: {},
      metadata,
    });
  }

  private async handleSnapRequest(args: SnapRPCRequest) {
    const response = await this.messagingSystem.call(
      'SnapController:handleRequest',
      args,
    );
    return response as InstitutionalSnapResponse;
  }

  private async shouldDeferPublication(transactionMeta: TransactionMeta) {
    const account = (await this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      transactionMeta.txParams.from as string,
    )) as unknown as DeferrableTransactionAccount;

    return account?.options.custodian?.deferPublication;
  }

  async deferPublicationHook(
    transactionController: TransactionController,
    transactionMeta: TransactionMeta,
  ): Promise<boolean> {
    const shouldDefer = await this.shouldDeferPublication(transactionMeta);

    if (shouldDefer) {
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

      const snapResponse = await this.handleSnapRequest(
        snapGetMutableTransactionParamsPayload,
      );

      const hash = snapResponse.transaction.transactionHash;

      transactionController.updateCustodialTransaction(transactionMeta.id, {
        status: TransactionStatus.submitted,
        hash,
        nonce: snapResponse.transaction.nonce,
        gasLimit: snapResponse.transaction.gasLimit,
        maxFeePerGas: snapResponse.transaction.maxFeePerGas,
        maxPriorityFeePerGas: snapResponse.transaction.maxPriorityFeePerGas,
        type: snapResponse.transaction.type as TransactionEnvelopeType,
      });
      return false;
    }
    return true;
  }

  async beforeCheckPendingTransactionHook(transactionMeta: TransactionMeta) {
    const shouldDefer = await this.shouldDeferPublication(transactionMeta);
    return !shouldDefer;
  }
}
