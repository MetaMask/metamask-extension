import SmartTransactionsController, {
  SmartTransactionsControllerSmartTransactionEvent,
} from '@metamask/smart-transactions-controller';
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
  TransactionType,
  type PublishBatchHookTransaction,
} from '@metamask/transaction-controller';
import log from 'loglevel';
import { RestrictedMessenger } from '@metamask/base-controller';
import {
  AddApprovalRequest,
  UpdateRequestState,
  StartFlow,
  EndFlow,
  AcceptRequest,
} from '@metamask/approval-controller';

import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { CANCEL_GAS_LIMIT_DEC } from '../../../../shared/constants/smartTransactions';
import { isLegacyTransaction } from '../../../../shared/modules/transaction.utils';
import {
  SMART_TRANSACTION_CONFIRMATION_TYPES,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';
import {
  getChainSupportsSmartTransactions,
  getFeatureFlagsByChainId,
  getIsSmartTransaction,
  getSmartTransactionsPreferenceEnabled,
  isHardwareWallet,
} from '../../../../shared/modules/selectors';
import { ControllerFlatState } from '../../controller-init/controller-list';
import { TransactionControllerInitMessenger } from '../../controller-init/messengers/transaction-controller-messenger';
import { Delegation7702PublishHook } from '../transaction/hooks/delegation-7702-publish';
import { getTransactionById } from '../transaction/util';

const namespace = 'SmartTransactions';

export type AllowedActions =
  | AddApprovalRequest
  | UpdateRequestState
  | StartFlow
  | AcceptRequest
  | EndFlow;
export type AllowedEvents = SmartTransactionsControllerSmartTransactionEvent;

export type SmartTransactionHookMessenger = RestrictedMessenger<
  typeof namespace,
  AllowedActions,
  AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

export type FeatureFlags = {
  extensionActive: boolean;
  mobileActive: boolean;
  smartTransactions: {
    expectedDeadline?: number;
    maxDeadline?: number;
    extensionReturnTxHashAsap?: boolean;
  };
};

export type SubmitSmartTransactionRequest = {
  transactionMeta: TransactionMeta;
  signedTransactionInHex?: string;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
  isSmartTransaction: boolean;
  controllerMessenger: SmartTransactionHookMessenger;
  featureFlags: FeatureFlags;
  transactions?: PublishBatchHookTransaction[];
};

class SmartTransactionHook {
  // Static property to store the approval flow ID across instances
  static #sharedApprovalFlowId = '';

  #approvalFlowEnded: boolean;

  #approvalFlowId: string;

  #chainId: Hex;

  #controllerMessenger: SmartTransactionHookMessenger;

  #featureFlags: {
    extensionActive: boolean;
    mobileActive: boolean;
    smartTransactions: {
      expectedDeadline?: number;
      maxDeadline?: number;
      extensionReturnTxHashAsap?: boolean;
    };
  };

  #isDapp: boolean;

  #isSmartTransaction: boolean;

  #smartTransactionsController: SmartTransactionsController;

  #transactionController: TransactionController;

  #transactionMeta: TransactionMeta;

  #signedTransactionInHex?: string;

  #transactions?: PublishBatchHookTransaction[];

  #txParams: TransactionParams;

  #shouldShowStatusPage: boolean;

  constructor(request: SubmitSmartTransactionRequest) {
    const {
      transactionMeta,
      signedTransactionInHex,
      smartTransactionsController,
      transactionController,
      isSmartTransaction,
      controllerMessenger,
      featureFlags,
      transactions,
    } = request;
    this.#approvalFlowId = '';
    this.#approvalFlowEnded = false;
    this.#transactionMeta = transactionMeta as TransactionMeta;
    this.#signedTransactionInHex = signedTransactionInHex;
    this.#smartTransactionsController = smartTransactionsController;
    this.#transactionController = transactionController;
    this.#isSmartTransaction = isSmartTransaction;
    this.#controllerMessenger = controllerMessenger;
    this.#featureFlags = featureFlags;
    this.#isDapp = transactionMeta.origin !== ORIGIN_METAMASK;
    this.#chainId = transactionMeta.chainId;
    this.#txParams = transactionMeta.txParams;
    this.#transactions = transactions;
    this.#shouldShowStatusPage = Boolean(
      transactionMeta.type !== TransactionType.bridge ||
        (this.#transactions && this.#transactions.length > 0),
    );
  }

  async submit() {
    const isUnsupportedTransactionTypeForSmartTransaction = this
      .#transactionMeta.type
      ? [
          TransactionType.swapAndSend,
          TransactionType.swapApproval,
          TransactionType.bridgeApproval,
        ].includes(this.#transactionMeta.type)
      : false;

    // Will cause TransactionController to publish to the RPC provider as normal.
    const useRegularTransactionSubmit = { transactionHash: undefined };
    if (
      !this.#isSmartTransaction ||
      isUnsupportedTransactionTypeForSmartTransaction ||
      isLegacyTransaction(this.#transactionMeta)
    ) {
      return useRegularTransactionSubmit;
    }

    if (this.#shouldShowStatusPage) {
      await this.#startApprovalFlow();
    }
    let getFeesResponse;
    try {
      getFeesResponse = await this.#smartTransactionsController.getFees(
        { ...this.#txParams, chainId: this.#chainId },
        undefined,
        { networkClientId: this.#transactionMeta.networkClientId },
      );
    } catch (error) {
      log.error(
        'Error in smart transaction publish hook, falling back to regular transaction submission',
        error,
      );
      this.#onApproveOrReject();
      return useRegularTransactionSubmit; // Fallback to regular transaction submission.
    }
    try {
      const submitTransactionResponse = await this.#signAndSubmitTransactions({
        getFeesResponse,
      });

      const uuid = submitTransactionResponse?.uuid;
      if (!uuid) {
        throw new Error('No smart transaction UUID');
      }

      await this.#processApprovalIfNeeded(uuid);

      const extensionReturnTxHashAsap =
        this.#featureFlags?.smartTransactions?.extensionReturnTxHashAsap;

      let transactionHash: string | undefined | null;
      if (extensionReturnTxHashAsap && submitTransactionResponse?.txHash) {
        transactionHash = submitTransactionResponse.txHash;
      } else {
        transactionHash = await this.#waitForTransactionHash({
          uuid,
        });
      }

      if (transactionHash === null) {
        throw new Error(
          'Transaction does not have a transaction hash, there was a problem',
        );
      }
      return { transactionHash };
    } catch (error) {
      log.error('Error in smart transaction publish hook', error);
      this.#onApproveOrReject();
      throw error;
    }
  }

  async submitBatch() {
    // No fallback to regular transaction submission
    if (!this.#isSmartTransaction) {
      throw new Error(
        'submitBatch: Smart Transaction is required for batch submissions',
      );
    }

    if (this.#shouldShowStatusPage) {
      await this.#startApprovalFlow();
    }

    try {
      const submitTransactionResponse = await this.#signAndSubmitTransactions();
      const uuid = submitTransactionResponse?.uuid;

      if (!uuid) {
        throw new Error('submitBatch: No smart transaction UUID');
      }

      await this.#processApprovalIfNeeded(uuid);

      const transactionHash = await this.#waitForTransactionHash({
        uuid,
      });

      if (transactionHash === null) {
        throw new Error(
          'submitBatch: Transaction does not have a transaction hash, there was a problem',
        );
      }

      let submitBatchResponse;
      if (submitTransactionResponse?.txHashes) {
        submitBatchResponse = {
          results: submitTransactionResponse.txHashes.map((txHash: string) => ({
            transactionHash: txHash,
          })),
        };
      } else {
        submitBatchResponse = {
          results: [],
        };
      }

      return submitBatchResponse;
    } catch (error) {
      log.error(
        'submitBatch: Error in smart transaction publish batch hook',
        error,
      );
      this.#onApproveOrReject();
      throw error;
    }
  }

  async #endApprovalFlow(flowId: string): Promise<void> {
    try {
      await this.#controllerMessenger.call('ApprovalController:endFlow', {
        id: flowId,
      });
    } catch (error) {
      // If the flow is already ended, we can ignore the error.
    }
  }

  async #endExistingApprovalFlow(approvalFlowId: string): Promise<void> {
    try {
      // End the existing flow
      await this.#endApprovalFlow(approvalFlowId);

      // Accept the request to close the UI
      await this.#controllerMessenger.call(
        'ApprovalController:acceptRequest',
        approvalFlowId,
      );

      SmartTransactionHook.#sharedApprovalFlowId = '';
    } catch (error) {
      log.error('Error ending existing approval flow', error);
    }
  }

  async #startApprovalFlow() {
    if (SmartTransactionHook.#sharedApprovalFlowId) {
      await this.#endExistingApprovalFlow(
        SmartTransactionHook.#sharedApprovalFlowId,
      );
    }

    // Create a new approval flow
    const { id: approvalFlowId } = await this.#controllerMessenger.call(
      'ApprovalController:startFlow',
    );

    // Store the flow ID both in the instance and in the static property
    this.#approvalFlowId = approvalFlowId;
    SmartTransactionHook.#sharedApprovalFlowId = approvalFlowId;
  }

  async #processApprovalIfNeeded(uuid: string) {
    if (this.#shouldShowStatusPage) {
      this.#addApprovalRequest({
        uuid,
      });
      this.#addListenerToUpdateStatusPage({
        uuid,
      });
    }
  }

  #onApproveOrReject() {
    if (!this.#shouldShowStatusPage || this.#approvalFlowEnded) {
      return;
    }
    this.#approvalFlowEnded = true;
    this.#endApprovalFlow(this.#approvalFlowId);

    // Clear the shared approval flow ID when we end the flow
    if (SmartTransactionHook.#sharedApprovalFlowId === this.#approvalFlowId) {
      SmartTransactionHook.#sharedApprovalFlowId = '';
    }
  }

  #addApprovalRequest({ uuid }: { uuid: string }) {
    const onApproveOrRejectWrapper = () => {
      this.#onApproveOrReject();
    };
    this.#controllerMessenger
      .call(
        'ApprovalController:addRequest',
        {
          id: this.#approvalFlowId,
          origin,
          type: SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
          requestState: {
            smartTransaction: {
              status: SmartTransactionStatuses.PENDING,
              creationTime: Date.now(),
              uuid,
            },
            isDapp: this.#isDapp,
            txId: this.#transactionMeta.id,
          },
        },
        true,
      )
      .then(onApproveOrRejectWrapper, onApproveOrRejectWrapper);
  }

  async #updateApprovalRequest({
    smartTransaction,
  }: {
    smartTransaction: SmartTransaction;
  }) {
    return await this.#controllerMessenger.call(
      'ApprovalController:updateRequestState',
      {
        id: this.#approvalFlowId,
        requestState: {
          smartTransaction,
          isDapp: this.#isDapp,
          txId: this.#transactionMeta.id,
        },
      },
    );
  }

  async #addListenerToUpdateStatusPage({ uuid }: { uuid: string }) {
    this.#controllerMessenger.subscribe(
      'SmartTransactionsController:smartTransaction',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (smartTransaction: SmartTransaction) => {
        if (smartTransaction.uuid === uuid) {
          const { status } = smartTransaction;
          if (!status || status === SmartTransactionStatuses.PENDING) {
            return;
          }
          if (!this.#approvalFlowEnded) {
            await this.#updateApprovalRequest({
              smartTransaction,
            });
          }
        }
      },
    );
  }

  #waitForTransactionHash({ uuid }: { uuid: string }): Promise<string | null> {
    return new Promise((resolve) => {
      this.#controllerMessenger.subscribe(
        'SmartTransactionsController:smartTransaction',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (smartTransaction: SmartTransaction) => {
          if (smartTransaction.uuid === uuid) {
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
          }
        },
      );
    });
  }

  async #signAndSubmitTransactions({
    getFeesResponse,
  }: {
    getFeesResponse?: Fees;
  } = {}) {
    let signedTransactions: string[] = [];

    if (
      this.#transactions &&
      Array.isArray(this.#transactions) &&
      this.#transactions.length > 0
    ) {
      // Batch transaction mode - extract signed transactions from this.#transactions[].signedTx
      signedTransactions = this.#transactions
        .filter((tx) => tx?.signedTx)
        .map((tx) => tx.signedTx);
    } else if (this.#signedTransactionInHex) {
      // Single transaction mode with pre-signed transaction
      signedTransactions = [this.#signedTransactionInHex];
    } else if (getFeesResponse) {
      // Single transaction mode requiring signing
      signedTransactions = await this.#createSignedTransactions(
        getFeesResponse.tradeTxFees?.fees ?? [],
        false,
      );
    }

    return await this.#smartTransactionsController.submitSignedTransactions({
      signedTransactions,
      signedCanceledTransactions: [],
      txParams: this.#txParams,
      transactionMeta: this.#transactionMeta,
      networkClientId: this.#transactionMeta.networkClientId,
    });
  }

  #applyFeeToTransaction(fee: Fee, isCancel: boolean): TransactionParams {
    if (!this.#txParams) {
      throw new Error('Transaction params are required');
    }

    const unsignedTransaction = {
      ...this.#txParams,
      maxFeePerGas: `0x${decimalToHex(fee.maxFeePerGas)}`,
      maxPriorityFeePerGas: `0x${decimalToHex(fee.maxPriorityFeePerGas)}`,
      gas: isCancel
        ? `0x${decimalToHex(CANCEL_GAS_LIMIT_DEC)}` // It has to be 21000 for cancel transactions, otherwise the API would reject it.
        : this.#txParams.gas,
    } as TransactionParams;

    if (isCancel) {
      unsignedTransaction.to = unsignedTransaction.from;
      unsignedTransaction.data = '0x';
    }

    return unsignedTransaction;
  }

  async #createSignedTransactions(
    fees: Fee[],
    isCancel: boolean,
  ): Promise<string[]> {
    if (!this.#txParams || !this.#chainId) {
      throw new Error('Transaction params and chainId are required');
    }

    const unsignedTransactions = fees.map((fee) => {
      return this.#applyFeeToTransaction(fee, isCancel);
    });

    const transactionsWithChainId = unsignedTransactions.map((tx) => ({
      ...tx,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      chainId: tx.chainId || this.#chainId,
    }));

    return (await this.#transactionController.approveTransactionsWithSameNonce(
      transactionsWithChainId as (TransactionParams & { chainId: Hex })[],
      { hasNonce: true },
    )) as string[];
  }
}

export const submitSmartTransactionHook = (
  request: SubmitSmartTransactionRequest,
) => {
  const smartTransactionHook = new SmartTransactionHook(request);
  return smartTransactionHook.submit();
};

export const submitBatchSmartTransactionHook = (
  request: SubmitSmartTransactionRequest,
) => {
  const smartTransactionHook = new SmartTransactionHook(request);
  return smartTransactionHook.submitBatch();
};

function getUIState(flatState: ControllerFlatState) {
  return { metamask: flatState };
}

function getSmartTransactionCommonParams(
  flatState: ControllerFlatState,
  chainId?: string,
) {
  // UI state is required to support shared selectors to avoid duplicate logic in frontend and backend.
  // Ideally all backend logic would instead rely on messenger event / state subscriptions.
  const uiState = getUIState(flatState);

  // @ts-expect-error Smart transaction selector types does not match controller state
  const isSmartTransaction = getIsSmartTransaction(uiState, chainId);

  // @ts-expect-error Smart transaction selector types does not match controller state
  const featureFlags = getFeatureFlagsByChainId(uiState, chainId);

  const isHardwareWalletAccount = isHardwareWallet(uiState);

  return {
    isSmartTransaction,
    featureFlags,
    isHardwareWalletAccount,
  };
}

export async function publishSmartTransactionHook({
  flatState,
  initMessenger,
  signedTx,
  smartTransactionsController,
  transactionController,
  transactionMeta,
}: {
  flatState: ControllerFlatState;
  initMessenger: TransactionControllerInitMessenger;
  signedTx: string;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
  transactionMeta: TransactionMeta;
}) {
  const result = await publishSmartTransactionHookHelper(
    transactionController,
    smartTransactionsController,
    initMessenger,
    flatState,
    transactionMeta,
    signedTx as Hex,
  );

  if (result?.transactionHash) {
    return result;
  }

  const hook = new Delegation7702PublishHook({
    isAtomicBatchSupported: transactionController.isAtomicBatchSupported.bind(
      transactionController,
    ),
    messenger: initMessenger,
  }).getHook();

  return await hook(transactionMeta, signedTx);
}

async function publishSmartTransactionHookHelper(
  transactionController: TransactionController,
  smartTransactionsController: SmartTransactionsController,
  hookControllerMessenger: SmartTransactionHookMessenger,
  flatState: ControllerFlatState,
  transactionMeta: TransactionMeta,
  signedTransactionInHex: Hex,
) {
  const { isSmartTransaction, featureFlags, isHardwareWalletAccount } =
    getSmartTransactionCommonParams(flatState, transactionMeta.chainId);

  if (!isSmartTransaction) {
    // Will cause TransactionController to publish to the RPC provider as normal.
    return { transactionHash: undefined };
  }

  return await submitSmartTransactionHook({
    transactionMeta,
    signedTransactionInHex,
    transactionController,
    smartTransactionsController,
    controllerMessenger: hookControllerMessenger,
    isSmartTransaction,
    isHardwareWallet: isHardwareWalletAccount,
    // @ts-expect-error Smart transaction selector return type does not match FeatureFlags type from hook
    featureFlags,
  });
}

export function publishBatchSmartTransactionHook({
  transactionController,
  smartTransactionsController,
  hookControllerMessenger,
  flatState,
  transactions,
}: {
  transactionController: TransactionController;
  smartTransactionsController: SmartTransactionsController;
  hookControllerMessenger: SmartTransactionHookMessenger;
  flatState: ControllerFlatState;
  transactions: PublishBatchHookTransaction[];
}) {
  // Get transactionMeta based on the last transaction ID
  const lastTransaction = transactions[transactions.length - 1];
  const transactionMeta = getTransactionById(
    lastTransaction.id ?? '',
    transactionController,
  );

  // If we couldn't find the transaction, we should handle that gracefully
  if (!transactionMeta) {
    throw new Error(
      `publishBatchSmartTransactionHook: Could not find transaction with id ${lastTransaction.id}`,
    );
  }

  const { isSmartTransaction, featureFlags, isHardwareWalletAccount } =
    getSmartTransactionCommonParams(flatState, transactionMeta.chainId);

  if (!isSmartTransaction) {
    throw new Error(
      'publishBatchSmartTransactionHook: Smart Transaction is required for batch submissions',
    );
  }

  return submitBatchSmartTransactionHook({
    transactions,
    transactionController,
    smartTransactionsController,
    controllerMessenger: hookControllerMessenger,
    isSmartTransaction,
    isHardwareWallet: isHardwareWalletAccount,
    // @ts-expect-error Smart transaction selector return type does not match FeatureFlags type from hook
    featureFlags,
    transactionMeta,
  });
}
