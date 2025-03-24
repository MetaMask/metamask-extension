import { TransactionController } from '@metamask/transaction-controller';
import { submitRequestToBackground } from '../background-connection';

export async function updateAtomicBatchData(
  request: Parameters<TransactionController['updateAtomicBatchData']>[0],
) {
  return await submitRequestToBackground<void>('updateAtomicBatchData', [
    request,
  ]);
}

export async function updateSelectedGasFeeToken(
  ...args: Parameters<TransactionController['updateSelectedGasFeeToken']>
) {
  return await submitRequestToBackground<void>(
    'updateSelectedGasFeeToken',
    args,
  );
}
