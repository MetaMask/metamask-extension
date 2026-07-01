import {
  ApprovalControllerAddRequestAction,
  ApprovalControllerUpdateRequestStateAction,
} from '@metamask/approval-controller';
import {
  SmartTransactionsController,
  SmartTransactionsControllerSmartTransactionEvent,
  SmartTransactionStatuses,
  type Fee,
  type Fees,
  type SmartTransaction,
  type SmartTransactionsNetworkConfig,
  type SignedTransactionWithMetadata,
} from '@metamask/smart-transactions-controller';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
  TransactionType,
  type PublishBatchHookTransaction,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import {
  ORIGIN_METAMASK,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../shared/constants/app';
import { CANCEL_GAS_LIMIT_DEC } from '../../../../shared/constants/smartTransactions';
import { decimalToHex } from '../../../../shared/lib/conversion.utils';
import {
  getIsSmartTransaction,
  getSmartTransactionsFeatureFlagsForChain,
} from '../../../../shared/lib/selectors';
import { isHardwareWallet } from '../../../../shared/lib/selectors/keyring';
import { getCurrentChainId } from '../../../../shared/lib/selectors/networks';
import { isLegacyTransaction } from '../../../../shared/lib/transaction.utils';
import { MessengerClientFlatState } from '../../messenger-client-init/controller-list';
import { getTransactionById } from '../transaction/util';
import {
  getClientForTransactionMetadata,
  getClientVersionForTransactionMetadata,
  sanitizeOrigin,
} from './utils';

const namespace = 'SmartTransactions';

export type AllowedActions =
  | ApprovalControllerAddRequestAction
  | ApprovalControllerUpdateRequestStateAction;
export type AllowedEvents = SmartTransactionsControllerSmartTransactionEvent;

export type SmartTransactionHookMessenger = Messenger<
  typeof namespace,
  AllowedActions,
  AllowedEvents
>;

export type FeatureFlags = SmartTransactionsNetworkConfig;

type SmartTransactionSubmitSignedTransactionsRequest = Parameters<
  SmartTransactionsController['submitSignedTransactions']
>[0];

type SmartTransactionSentinelMeta = NonNullable<
  SignedTransactionWithMetadata['metadata']
>;

type SmartTransactionTxType = SmartTransactionSentinelMeta['txType'];

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
  #approvalFlowEnded: boolean;

  // Pending approval identifier
  #approvalRequestId: string;

  #chainId: Hex;

  #controllerMessenger: SmartTransactionHookMessenger;

  #featureFlags: FeatureFlags;

  #isDapp: boolean;

  #isSmartTransaction: boolean;

  #smartTransactionsController: SmartTransactionsController;

  #transactionController: TransactionController;

  #transactionMeta: TransactionMeta;

  #signedTransactionInHex?: string;

  #transactions?: PublishBatchHookTransaction[];

  #txParams: TransactionParams;

  // Whether a headless status approval is created for this transaction
  #shouldShowStatusPage: boolean;

  #getSentinelMetadata(
    transactionMeta: TransactionMeta,
  ): SmartTransactionSentinelMeta {
    return {
      // smart-transactions-controller still depends on transaction-controller
      // 64.x, while extension consumes 65.x. The enum values are strings at
      // runtime, so bridge the duplicate package types at this boundary.
      txType: transactionMeta.type as SmartTransactionTxType,
      client: getClientForTransactionMetadata(),
      clientVersion: getClientVersionForTransactionMetadata(),
      origin: sanitizeOrigin(transactionMeta.origin),
    };
  }

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
    this.#approvalRequestId = '';
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

    const legacyShowStatusPage = Boolean(
      (transactionMeta.type !== TransactionType.bridge &&
        transactionMeta.type !== TransactionType.shieldSubscriptionApprove &&
        transactionMeta.type !== TransactionType.perpsDeposit &&
        transactionMeta.type !== TransactionType.perpsDepositAndOrder) ||
      (this.#transactions && this.#transactions.length > 0),
    );

    this.#shouldShowStatusPage = legacyShowStatusPage;

    log.info(
      '[SmartTransaction] shouldShowStatusPage:',
      this.#shouldShowStatusPage,
    );
  }

  async submit() {
    const isUnsupportedTransactionTypeForSmartTransaction =
      this.#transactionMeta.type
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

    let getFeesResponse;
    // Skip getting fees if the tx is signed and sponsored
    if (
      !this.#signedTransactionInHex ||
      !this.#transactionMeta.isGasFeeSponsored
    ) {
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
        this.#featureFlags?.extensionReturnTxHashAsap;

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

    try {
      const submitTransactionResponse = await this.#signAndSubmitTransactions();
      const uuid = submitTransactionResponse?.uuid;

      if (!uuid) {
        throw new Error('submitBatch: No smart transaction UUID');
      }

      await this.#processApprovalIfNeeded(uuid);

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

      const extensionReturnTxHashAsapBatch =
        this.#featureFlags?.extensionReturnTxHashAsapBatch;

      if (
        extensionReturnTxHashAsapBatch &&
        submitBatchResponse?.results?.length > 0
      ) {
        return submitBatchResponse;
      }

      const transactionHash = await this.#waitForTransactionHash({
        uuid,
      });

      if (transactionHash === null) {
        throw new Error(
          'submitBatch: Transaction does not have a transaction hash, there was a problem',
        );
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

  // This approval is headless (no UI) and only feeds the
  // `'redux'` smart-transaction toasts. Remove it once the `'redux'` toast path
  // is gone (see `selectToastImplementation`)
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
  }

  #addApprovalRequest({ uuid }: { uuid: string }) {
    const onApproveOrRejectWrapper = () => {
      this.#onApproveOrReject();
    };
    this.#approvalRequestId = uuid;

    this.#controllerMessenger
      .call(
        'ApprovalController:addRequest',
        {
          id: this.#approvalRequestId,
          origin,
          type: SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
          requestState: {
            smartTransaction: {
              status: SmartTransactionStatuses.PENDING,
              creationTime: Date.now(),
              uuid,
              chainId: this.#chainId,
            },
            isDapp: this.#isDapp,
            txId: this.#transactionMeta.id,
          },
        },
        false,
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
        id: this.#approvalRequestId,
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
    let signedTransactionsWithMetadata: SignedTransactionWithMetadata[] = [];
    let signedTransactions: string[] = [];

    if (
      this.#transactions &&
      Array.isArray(this.#transactions) &&
      this.#transactions.length > 0
    ) {
      // Batch transaction mode - extract signed transactions from this.#transactions[].signedTx
      signedTransactionsWithMetadata = this.#transactions
        .filter((tx) => tx?.signedTx)
        .map((tx) => {
          const transactionMeta = getTransactionById(
            tx.id ?? '',
            this.#transactionController,
          );
          const signedTx: SignedTransactionWithMetadata = { tx: tx.signedTx };
          if (transactionMeta) {
            signedTx.metadata = this.#getSentinelMetadata(transactionMeta);
          }
          return signedTx;
        });
    } else if (this.#signedTransactionInHex) {
      // Single transaction mode with pre-signed transaction
      signedTransactionsWithMetadata = [
        {
          tx: this.#signedTransactionInHex,
          metadata: this.#getSentinelMetadata(this.#transactionMeta),
        },
      ];
    } else if (getFeesResponse) {
      // Single transaction mode requiring signing
      const signed = await this.#createSignedTransactions(
        getFeesResponse.tradeTxFees?.fees ?? [],
        false,
      );
      signedTransactionsWithMetadata = signed.map((signedTx) => ({
        tx: signedTx,
        metadata: this.#getSentinelMetadata(this.#transactionMeta),
      }));
    }
    signedTransactions = signedTransactionsWithMetadata.map((tx) => tx.tx);

    const txParams =
      this.#txParams as SmartTransactionSubmitSignedTransactionsRequest['txParams'];
    const transactionMeta =
      this.#transactionMeta as SmartTransactionSubmitSignedTransactionsRequest['transactionMeta'];

    const submitRequest: SmartTransactionSubmitSignedTransactionsRequest = {
      signedTransactions,
      signedTransactionsWithMetadata,
      signedCanceledTransactions: [],
      txParams,
      transactionMeta,
      networkClientId: this.#transactionMeta.networkClientId,
    };

    return await this.#smartTransactionsController.submitSignedTransactions(
      submitRequest,
    );
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

function getUIState(flatState: MessengerClientFlatState) {
  return { metamask: flatState };
}

export function getSmartTransactionCommonParams(
  flatState: MessengerClientFlatState,
  chainId?: Hex,
) {
  // UI state is required to support shared selectors to avoid duplicate logic in frontend and backend.
  // Ideally all backend logic would instead rely on messenger event / state subscriptions.
  const uiState = getUIState(flatState);
  const effectiveChainId = chainId ?? getCurrentChainId(uiState);
  // @ts-expect-error Smart transaction selector types does not match controller state
  const isSmartTransaction = getIsSmartTransaction(uiState, chainId);

  const featureFlags = getSmartTransactionsFeatureFlagsForChain(
    uiState,
    effectiveChainId,
  );

  const isHardwareWalletAccount = isHardwareWallet(uiState);

  return {
    isSmartTransaction,
    featureFlags,
    isHardwareWalletAccount,
  };
}
