import SmartTransactionsController from '@metamask/smart-transactions-controller';
import {
  Fee,
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

import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import {
  SMART_TRANSACTION_CONFIRMATION_TYPES,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';

export type SubmitSmartTransactionRequest = {
  transactionMeta: TransactionMeta;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
  isSmartTransaction: boolean;
  controllerMessenger: any;
};

export async function submitSmartTransactionHook(
  request: SubmitSmartTransactionRequest,
) {
  const {
    transactionMeta,
    smartTransactionsController,
    transactionController,
    isSmartTransaction,
    controllerMessenger,
  } = request;
  log.info('Smart Transaction - Executing publish hook', transactionMeta);
  const isDapp = transactionMeta?.origin !== ORIGIN_METAMASK;
  const { chainId, txParams } = transactionMeta;
  // Will cause TransactionController to publish to the RPC provider as normal.
  const useRegularTransactionSubmit = { transactionHash: undefined };
  if (!isSmartTransaction) {
    log.info(
      `Smart Transaction - Skipping hook as it is not a smart transaction on chainId: ${chainId}`,
    );
    return useRegularTransactionSubmit;
  }
  const { id } = controllerMessenger.call('ApprovalController:startFlow');
  const smartTransactionStatusApprovalId: string = id;
  try {
    const feesResponse = await smartTransactionsController.getFees(
      { ...txParams, chainId },
      undefined,
    );
    log.info('Smart Transaction - Retrieved fees', feesResponse);
    const signedTransactions = await createSignedTransactions(
      txParams,
      feesResponse.tradeTxFees?.fees ?? [],
      false,
      transactionController,
      chainId,
    );
    const signedCanceledTransactions = await createSignedTransactions(
      txParams,
      feesResponse.tradeTxFees?.cancelFees || [],
      true,
      transactionController,
      chainId,
    );
    log.info('Smart Transaction - Generated signed transactions', {
      signedTransactions,
      signedCanceledTransactions,
    });
    log.info('Smart Transaction - Submitting signed transactions');
    const response = await smartTransactionsController.submitSignedTransactions(
      {
        signedTransactions,
        signedCanceledTransactions,
        txParams,
        // Patched into controller to skip unnecessary call to confirmExternalTransaction.
        skipConfirm: false,
      },
    );
    const uuid = response?.uuid;
    if (!uuid) {
      throw new Error('No smart transaction UUID');
    }
    log.info('Smart Transaction - Received UUID', uuid);
    controllerMessenger.call(
      'ApprovalController:addRequest',
      {
        id: smartTransactionStatusApprovalId,
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
    );
    let transactionHash: string | undefined | null;
    (smartTransactionsController as any).eventEmitter.on(
      `${uuid}:smartTransaction`,
      async (smartTransaction: SmartTransaction) => {
        log.info('Smart Transaction: ', smartTransaction);
        const { status, statusMetadata } = smartTransaction;
        if (!status || status === SmartTransactionStatuses.PENDING) {
          return;
        }
        await controllerMessenger.call(
          'ApprovalController:updateRequestState',
          {
            id: smartTransactionStatusApprovalId,
            requestState: {
              smartTransaction,
              isDapp,
            },
          },
        );
        if (statusMetadata?.minedHash) {
          log.info(
            'Smart Transaction - Received tx hash: ',
            statusMetadata?.minedHash,
          );
          transactionHash = statusMetadata.minedHash;
        } else {
          transactionHash = null;
        }
      },
    );
    const waitForTransactionHashChange = () => {
      return new Promise((resolve) => {
        const checkVariable = () => {
          if (transactionHash === undefined) {
            setTimeout(checkVariable, 100); // Check again after 100ms
          } else {
            resolve(`transactionHash has changed to: ${transactionHash}`);
          }
        };

        checkVariable();
      });
    };
    await waitForTransactionHashChange();
    if (transactionHash === null) {
      throw new Error(
        'Transaction does not have a transaction hash, there was a problem',
      );
    }
    return { transactionHash };
  } catch (error) {
    log.error(error);
    throw error;
  } finally {
    controllerMessenger.call('ApprovalController:endFlow', {
      id: smartTransactionStatusApprovalId,
    });
  }
}

async function createSignedTransactions(
  txParams: TransactionParams,
  fees: Fee[],
  isCancel: boolean,
  transactionController: TransactionController,
  chainId: Hex,
): Promise<string[]> {
  const unsignedTransactions = fees.map((fee) => {
    return applyFeeToTransaction(txParams, fee, isCancel);
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

export function applyFeeToTransaction(
  txParams: TransactionParams,
  fee: Fee,
  isCancel: boolean,
): TransactionParams {
  const unsignedTransaction = {
    ...txParams,
    maxFeePerGas: `0x${decimalToHex(fee.maxFeePerGas)}`,
    maxPriorityFeePerGas: `0x${decimalToHex(fee.maxPriorityFeePerGas)}`,
    gas: isCancel
      ? `0x${decimalToHex(21000)}` // It has to be 21000 for cancel transactions, otherwise the API would reject it.
      : txParams.gas,
  };
  if (isCancel) {
    unsignedTransaction.to = unsignedTransaction.from;
    unsignedTransaction.data = '0x';
  }
  return unsignedTransaction;
}
