import { TransactionParams } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { FinalAddTransactionRequest } from './util';

// Seem to be set by dApps only for batch calls.
// For single-txs, this type doesn't appear.
const TEMPO_TRANSACTION_TYPE: Hex = '0x76';

type TempoCall = {
  to: Hex;
  // In our tests we see '0x' (probably to signal no native token),
  // However '0x' is invalid as a value and we use '0x0' when transforming.
  value: Hex | '0x';
  data: Hex;
};

type TempoTransactionParams = {
  from: Hex;
  chainId: Hex;
  type: '0x76';
  calls: TempoCall[];
  feeToken?: Hex;
};

export function buildBatchTransactionsFromTempoTransactionCalls(
  params: TempoTransactionParams,
) {
  return params.calls.map(({ data, to }) => {
    return {
      params: {
        data,
        to,
        // Tempo Transactions 'calls' parameters differ in a least having '0x'
        // (probably to signal absence of native token) instead of '0x0'.
        value: '0x0' as Hex,
      },
    };
  });
}

export function isTempoTransactionParams(
  params: TransactionParams,
): params is TempoTransactionParams {
  return (
    params !== null &&
    typeof params === 'object' &&
    !Array.isArray(params) &&
    'type' in params &&
    params.type === TEMPO_TRANSACTION_TYPE
  );
}

export function isTempoTransactionRequest(request: FinalAddTransactionRequest) {
  return request.transactionParams.type === TEMPO_TRANSACTION_TYPE;
}
