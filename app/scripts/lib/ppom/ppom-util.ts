import { normalizeTransactionParams } from '@metamask/transaction-controller';

const METHOD_SEND_TRANSACTION = 'eth_sendTransaction';

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePPOMRequest(request: any) {
  if (request.method !== METHOD_SEND_TRANSACTION) {
    return request;
  }

  const transactionParams = request.params?.[0] || {};
  const normalizedParams = normalizeTransactionParams(transactionParams);

  return {
    ...request,
    params: [normalizedParams],
  };
}
