import SmartTransactionsController from '@metamask/smart-transactions-controller';
import {
  Fee,
  Fees,
  SmartTransactionStatuses,
  SmartTransaction,
} from '@metamask/smart-transactions-controller/dist/types';
import type { Hex } from '@metamask/utils';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  RestrictedControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';
import {
  AddApprovalRequest,
  UpdateRequestState,
  StartFlow,
  EndFlow,
} from '@metamask/approval-controller';

import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { CANCEL_GAS_LIMIT_DEC } from '../../../../shared/constants/smartTransactions';
import {
  SMART_TRANSACTION_CONFIRMATION_TYPES,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';

const namespace = 'SmartTransactions';

type AllowedActions =
  | AddApprovalRequest
  | UpdateRequestState
  | StartFlow
  | EndFlow;

export type SmartTransactionsControllerMessenger =
  RestrictedControllerMessenger<
    typeof namespace,
    AllowedActions,
    EventConstraint,
    AllowedActions['type'],
    never
  >;

export type SubmitSmartTransactionRequest = {
  transactionMeta: TransactionMeta;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
  isSmartTransaction: boolean;
  controllerMessenger: SmartTransactionsControllerMessenger;
};

export class SmartTransactionHook {
  private approvalFlowEnded: boolean;

  private approvalFlowId: string;

  constructor() {
    this.approvalFlowId = '';
    this.approvalFlowEnded = false;
  }

  private addApprovalRequest({
    controllerMessenger,
    isDapp,
  }: {
    controllerMessenger: SmartTransactionsControllerMessenger;
    isDapp: boolean;
  }) {
    const onApproveOrRejectWrapper = () => {
      this.onApproveOrReject(controllerMessenger);
    };
    controllerMessenger
      .call(
        'ApprovalController:addRequest',
        {
          id: this.approvalFlowId,
          origin,
          type: SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
          requestState: {
            smartTransaction: {
              status: SmartTransactionStatuses.PENDING,
              creationTime: Date.now(),
            },
            isDapp,
          },
        },
        true,
      )
      .then(onApproveOrRejectWrapper, onApproveOrRejectWrapper);
  }

  private async updateApprovalRequest({
    controllerMessenger,
    isDapp,
    smartTransaction,
  }: {
    controllerMessenger: SmartTransactionsControllerMessenger;
    isDapp: boolean;
    smartTransaction: SmartTransaction;
  }) {
    return await controllerMessenger.call(
      'ApprovalController:updateRequestState',
      {
        id: this.approvalFlowId,
        requestState: {
          // @ts-expect-error: TODO: this line will be removed once we publish and use the latest STX controller.
          smartTransaction,
          isDapp,
        },
      },
    );
  }

  private async updateStxStatusPageOnStatusChange({
    smartTransactionsController,
    uuid,
    controllerMessenger,
    isDapp,
  }: {
    smartTransactionsController: SmartTransactionsController;
    uuid: string;
    controllerMessenger: SmartTransactionsControllerMessenger;
    isDapp: boolean;
  }) {
    (smartTransactionsController as any).eventEmitter.on(
      `${uuid}:smartTransaction`,
      async (smartTransaction: SmartTransaction) => {
        const { status } = smartTransaction;
        if (!status || status === SmartTransactionStatuses.PENDING) {
          return;
        }
        if (!this.approvalFlowEnded) {
          await this.updateApprovalRequest({
            controllerMessenger,
            isDapp,
            smartTransaction,
          });
        }
      },
    );
  }

  private waitForTransactionHash({
    smartTransactionsController,
    uuid,
  }: {
    smartTransactionsController: SmartTransactionsController;
    uuid: string;
  }): Promise<string | null> {
    return new Promise((resolve) => {
      (smartTransactionsController as any).eventEmitter.on(
        `${uuid}:smartTransaction`,
        async (smartTransaction: SmartTransaction) => {
          const { status, statusMetadata } = smartTransaction;
          if (!status || status === SmartTransactionStatuses.PENDING) {
            return;
          }
          log.debug('Smart Transaction: ', smartTransaction);
          if (statusMetadata?.minedHash) {
            log.debug(
              'Smart Transaction - Received tx hash: ',
              statusMetadata?.minedHash,
            );
            resolve(statusMetadata.minedHash);
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  private async signAndSubmitTransactions({
    txParams,
    getFeesResponse,
    transactionController,
    chainId,
    smartTransactionsController,
    transactionMeta,
  }: {
    txParams: TransactionParams;
    getFeesResponse: Fees;
    transactionController: TransactionController;
    chainId: Hex;
    smartTransactionsController: SmartTransactionsController;
    transactionMeta: TransactionMeta;
  }) {
    const signedTransactions = await this.createSignedTransactions(
      txParams,
      getFeesResponse.tradeTxFees?.fees ?? [],
      false,
      transactionController,
      chainId,
    );
    const signedCanceledTransactions = await this.createSignedTransactions(
      txParams,
      getFeesResponse.tradeTxFees?.cancelFees || [],
      true,
      transactionController,
      chainId,
    );
    return await smartTransactionsController.submitSignedTransactions({
      signedTransactions,
      signedCanceledTransactions,
      txParams,
      transactionMeta,
    });
  }

  private applyFeeToTransaction(
    txParams: TransactionParams,
    fee: Fee,
    isCancel: boolean,
  ): TransactionParams {
    const unsignedTransaction = {
      ...txParams,
      maxFeePerGas: `0x${decimalToHex(fee.maxFeePerGas)}`,
      maxPriorityFeePerGas: `0x${decimalToHex(fee.maxPriorityFeePerGas)}`,
      gas: isCancel
        ? `0x${decimalToHex(CANCEL_GAS_LIMIT_DEC)}` // It has to be 21000 for cancel transactions, otherwise the API would reject it.
        : txParams.gas,
    };
    if (isCancel) {
      unsignedTransaction.to = unsignedTransaction.from;
      unsignedTransaction.data = '0x';
    }
    return unsignedTransaction;
  }

  private async createSignedTransactions(
    txParams: TransactionParams,
    fees: Fee[],
    isCancel: boolean,
    transactionController: TransactionController,
    chainId: Hex,
  ): Promise<string[]> {
    const unsignedTransactions = fees.map((fee) => {
      return this.applyFeeToTransaction(txParams, fee, isCancel);
    });
    const transactionsWithChainId = unsignedTransactions.map((tx) => ({
      ...tx,
      chainId: tx.chainId || chainId,
    }));
    return (await transactionController.approveTransactionsWithSameNonce(
      transactionsWithChainId,
      { hasNonce: true },
    )) as string[];
  }

  async onApproveOrReject(
    controllerMessenger: SmartTransactionsControllerMessenger,
  ) {
    if (this.approvalFlowEnded) {
      return;
    }
    this.approvalFlowEnded = true;
    controllerMessenger.call('ApprovalController:endFlow', {
      id: this.approvalFlowId,
    });
  }

  async submit(request: SubmitSmartTransactionRequest) {
    const {
      transactionMeta,
      smartTransactionsController,
      transactionController,
      isSmartTransaction,
      controllerMessenger,
    } = request;
    const isDapp = transactionMeta.origin !== ORIGIN_METAMASK;
    const { chainId, txParams } = transactionMeta;
    // Will cause TransactionController to publish to the RPC provider as normal.
    const useRegularTransactionSubmit = { transactionHash: undefined };
    if (!isSmartTransaction) {
      return useRegularTransactionSubmit;
    }
    const { id: approvalFlowId } = await controllerMessenger.call(
      'ApprovalController:startFlow',
    );
    this.approvalFlowId = approvalFlowId;
    try {
      const getFeesResponse = await smartTransactionsController.getFees(
        { ...txParams, chainId },
        undefined,
      );
      const submitTransactionResponse = await this.signAndSubmitTransactions({
        txParams,
        getFeesResponse,
        transactionController,
        chainId,
        smartTransactionsController,
        transactionMeta,
      });
      const uuid = submitTransactionResponse?.uuid;
      if (!uuid) {
        throw new Error('No smart transaction UUID');
      }
      this.addApprovalRequest({
        controllerMessenger,
        isDapp,
      });
      this.updateStxStatusPageOnStatusChange({
        smartTransactionsController,
        uuid,
        controllerMessenger,
        isDapp,
      });
      const transactionHash = await this.waitForTransactionHash({
        smartTransactionsController,
        uuid,
      });
      if (transactionHash === null) {
        throw new Error(
          'Transaction does not have a transaction hash, there was a problem',
        );
      }
      return { transactionHash };
    } catch (error) {
      log.error(error);
      this.onApproveOrReject(controllerMessenger);
      throw error;
    }
  }
}
