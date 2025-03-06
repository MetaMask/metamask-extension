import {
  TransactionControllerUpdateCustodialTransactionAction,
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

const SNAP_ID = InstitutionalWalletSnap.snapId as SnapId;

const controllerName = 'InstitutionalSnapController';

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
  | AccountsControllerGetAccountByAddressAction
  | TransactionControllerUpdateCustodialTransactionAction;

export type InstitutionalSnapControllerMessenger = RestrictedMessenger<
  'InstitutionalSnapControllerMessenger',
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

type InstitutionalSnapControllerControllerState = Record<string, never>;

const metadata = {};

export class InstitutionalSnapController extends BaseController<
  'InstitutionalSnapController',
  InstitutionalSnapControllerControllerState,
  InstitutionalSnapControllerMessenger
> {
  constructor({
    messenger,
  }: {
    messenger: InstitutionalSnapControllerMessenger;
  }) {
    super({
      messenger,
      name: controllerName,
      state: {},
      metadata,
    });

    this.#registerMessageHandlers();
  }

  #registerMessageHandlers() {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:publishHook`,
      this.deferPublicationHook.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:beforeCheckPendingTransactionHook`,
      this.beforeCheckPendingTransactionHook.bind(this),
    );
  }

  private async handleSnapRequest(args: SnapRPCRequest) {
    const response = await this.messagingSystem.call(
      'SnapController:handleRequest',
      args,
    );
    return response as InstitutionalSnapResponse;
  }

  private async updateTransaction(
    transactionId: string,
    {
      status,
      hash,
      nonce,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      type,
    }: {
      status: TransactionStatus;
      hash: string;
      nonce: string;
      gasLimit: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      type: TransactionEnvelopeType;
    },
  ) {
    const response = await this.messagingSystem.call(
      'TransactionController:updateCustodialTransaction',
      {
        transactionId,
        status,
        hash,
        nonce,
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        type,
      },
    );
    return response;
  }

  private async shouldDeferPublication(transactionMeta: TransactionMeta) {
    const account = (await this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      transactionMeta.txParams.from as string,
    )) as unknown as DeferrableTransactionAccount;

    console.log('account', account);

    return account?.options.custodian?.deferPublication;
  }

  async deferPublicationHook(
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
        snapId: SNAP_ID,
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

      await this.updateTransaction(transactionMeta.id, {
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
