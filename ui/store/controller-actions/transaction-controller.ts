import {
  IsAtomicBatchSupportedResult,
  TransactionController,
} from '@metamask/transaction-controller';
import { submitRequestToBackground } from '../background-connection';

export async function isAtomicBatchSupported(
  ...args: Parameters<TransactionController['isAtomicBatchSupported']>
) {
  return await submitRequestToBackground<IsAtomicBatchSupportedResult>(
    'isAtomicBatchSupported',
    args,
  );
}

export async function updateAtomicBatchData(
  request: Parameters<TransactionController['updateAtomicBatchData']>[0],
) {
  return await submitRequestToBackground<void>('updateAtomicBatchData', [
    request,
  ]);
}

export async function updateBatchTransactions(
  ...args: Parameters<TransactionController['updateBatchTransactions']>
) {
  return await submitRequestToBackground<void>('updateBatchTransactions', args);
}

export async function updateSelectedGasFeeToken(
  ...args: Parameters<TransactionController['updateSelectedGasFeeToken']>
) {
  return await submitRequestToBackground<void>(
    'updateSelectedGasFeeToken',
    args,
  );
}
