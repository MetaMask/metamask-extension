import {
  TransactionControllerUpdateCustodialTransactionAction,
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { HandlerType } from '@metamask/snaps-utils';
import { BaseController, RestrictedMessenger } from '@metamask/base-controller';
import { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { INSTITUTIONAL_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts/institutional-wallet-snap';
import {
  InstitutionalSnapRequestSearchParameters,
  InstitutionalSnapResponse,
} from './institutional-snap-controller.types';

const SNAP_ID = INSTITUTIONAL_WALLET_SNAP_ID;

const controllerName = 'InstitutionalSnapController';

type SnapRPCRequest = Parameters<HandleSnapRequest['handler']>[0];

export type AllowedActions =
  | HandleSnapRequest
  | AccountsControllerGetAccountByAddressAction
  | TransactionControllerUpdateCustodialTransactionAction;

export type InstitutionalSnapControllerPublishHookAction = {
  type: `${typeof controllerName}:publishHook`;
  handler: InstitutionalSnapController['deferPublicationHook'];
};

export type InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction =
  {
    type: `${typeof controllerName}:beforeCheckPendingTransactionHook`;
    handler: InstitutionalSnapController['beforeCheckPendingTransactionHook'];
  };

type Actions =
  | AllowedActions
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction;

export type InstitutionalSnapControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  Actions,
  never,
  Actions['type'],
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

  async deferPublicationHook(
    transactionMeta: TransactionMeta,
  ): Promise<boolean> {
    const shouldDefer = await this.#shouldDeferPublication(transactionMeta);

    if (shouldDefer) {
      const updatedTransactionParameters =
        await this.#getUpdatedTransactionParameters(transactionMeta);

      await this.#updateTransaction(
        transactionMeta.id,
        updatedTransactionParameters,
      );
      return false;
    }

    return true;
  }

  async beforeCheckPendingTransactionHook(
    transactionMeta: TransactionMeta,
  ): Promise<boolean> {
    return !(await this.#shouldDeferPublication(transactionMeta));
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

  async #handleSnapRequest(args: SnapRPCRequest) {
    const response = await this.messagingSystem.call(
      'SnapController:handleRequest',
      args,
    );
    return response as InstitutionalSnapResponse;
  }

  async #getUpdatedTransactionParameters(transactionMeta: TransactionMeta) {
    const searchParams: InstitutionalSnapRequestSearchParameters = {
      from: transactionMeta.txParams.from as string,
      to: transactionMeta.txParams.to as string,
      value: transactionMeta.txParams.value as string,
      data: transactionMeta.txParams.data as string,
      chainId: transactionMeta.chainId as string,
    };

    const snapGetMutableTransactionParamsPayload: SnapRPCRequest = {
      snapId: SNAP_ID,
      origin: ORIGIN_METAMASK,
      handler: HandlerType.OnRpcRequest,
      request: {
        method: 'transactions.getMutableTransactionParameters',
        params: searchParams,
      },
    };

    const snapResponse = await this.#handleSnapRequest(
      snapGetMutableTransactionParamsPayload,
    );

    const hash = snapResponse.transaction.transactionHash;

    return {
      hash,
      nonce: snapResponse.transaction.nonce,
      gasLimit: snapResponse.transaction.gasLimit,
      maxFeePerGas: snapResponse.transaction.maxFeePerGas,
      maxPriorityFeePerGas: snapResponse.transaction.maxPriorityFeePerGas,
      type: snapResponse.transaction.type as TransactionEnvelopeType,
      status: TransactionStatus.submitted,
    };
  }

  async #updateTransaction(
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

  async #shouldDeferPublication(transactionMeta: TransactionMeta) {
    const account = (await this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      transactionMeta.txParams.from as string,
    )) as unknown as DeferrableTransactionAccount;

    return account?.options.custodian?.deferPublication;
  }
}
