import { ChainId } from '@metamask/controller-utils';
import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { Fee } from '@metamask/smart-transactions-controller/dist/types';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import log from 'loglevel';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';

export type SmartPublishRequest = {
  transactionMeta: TransactionMeta;
  smartTransactionsController: SmartTransactionsController;
  transactionController: TransactionController;
};

export async function publishHook(request: SmartPublishRequest) {
  const {
    transactionMeta,
    smartTransactionsController,
    transactionController,
  } = request;

  log.info('Smart Transaction - Executing publish hook', transactionMeta);

  const { chainId, txParams } = transactionMeta;

  // Also check PreferencesController state to see if smart transactions enabled for chain
  const isSmartTransactionsEnabled = [ChainId.mainnet, ChainId.goerli].includes(
    chainId as any,
  );

  if (!isSmartTransactionsEnabled) {
    log.info(
      'Smart Transaction - Skipping hook as not enabled for chain',
      chainId,
    );

    // Will cause TransactionController to publish to the RPC provider as normal.
    return { transactionHash: undefined };
  }

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
  );

  const signedCanceledTransactions = await createSignedTransactions(
    txParams,
    feesResponse.tradeTxFees?.cancelFees || [],
    true,
    transactionController,
  );

  log.info('Smart Transaction - Generated signed transactions', {
    signedTransactions,
    signedCanceledTransactions,
  });

  log.info('Smart Transaction - Submitting signed transactions');

  const response = await smartTransactionsController.submitSignedTransactions({
    signedTransactions,
    signedCanceledTransactions,
    txParams,
    // Patched into controller to skip unnecessary call to confirmExternalTransaction.
    skipConfirm: true,
  } as any);

  const uuid = response?.uuid;

  if (!uuid) {
    throw new Error('No smart transaction UUID');
  }

  log.info('Smart Transaction - Received UUID', uuid);

  (smartTransactionsController as any).hub.on(
    `${uuid}:status`,
    (status: any) => {
      log.info('Smart Transaction - Status update', status);
    },
  );

  const transactionHash = await new Promise((resolve) => {
    (smartTransactionsController as any).hub.once(
      `${uuid}:transaction-hash`,
      (hash: string) => {
        resolve(hash);
      },
    );
  });

  log.info('Smart Transaction - Received hash', transactionHash);

  return { transactionHash };
}

async function createSignedTransactions(
  txParams: TransactionParams,
  fees: Fee[],
  isCancel: boolean,
  transactionController: TransactionController,
): Promise<string[]> {
  const unsignedTransactions = fees.map((fee) =>
    applyFeeToTransaction(txParams, fee, isCancel),
  );

  return (await transactionController.approveTransactionsWithSameNonce(
    unsignedTransactions,
    { hasNonce: true },
  )) as string[];
}

function applyFeeToTransaction(
  txParams: TransactionParams,
  fee: Fee,
  isCancel: boolean,
): TransactionParams {
  const unsignedTransaction = {
    ...txParams,
    maxFeePerGas: decimalToHex(fee.maxFeePerGas),
    maxPriorityFeePerGas: decimalToHex(fee.maxPriorityFeePerGas),
    gas: isCancel
      ? decimalToHex(21000) // It has to be 21000 for cancel transactions, otherwise the API would reject it.
      : txParams.gas,
  };

  if (isCancel) {
    unsignedTransaction.to = unsignedTransaction.from;
    unsignedTransaction.data = '0x';
  }

  return unsignedTransaction;
}
