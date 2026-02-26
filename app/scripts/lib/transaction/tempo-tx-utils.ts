import { TransactionParams } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { FinalAddTransactionRequest } from './util';

// Seem to be set by dApps only for batch calls.
// For single-txs, this type doesn't appear.
const TEMPO_TRANSACTION_TYPE: Hex = '0x76';

// This could be in a flag/env var or other mechanism that allows per-chain enable/disable.
// Could also have one default fee token per chain. Keeping it simple for the PoC.
const ENABLED_TEMPO_CHAIN_IDS_HEX = [
  '0xa5bd', // Tempo older Testnet
  '0xa5bf', // Tempo Moderato Testnet
  '0x89', // Polygon Mainnet for testing
];

// If we want to impose a default fee token,
// (for example when not a 0x76 transaction),
// we'll fallback to this fee token.
const DEFAULT_FEE_TOKEN_ADDRESS: Hex =
  '0x20c0000000000000000000000000000000000000';

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

function buildBatchTransactionsFromTempoTransactionCalls(
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

export function getTempoTransactionBatchRequestParams(
  params: TempoTransactionParams,
) {
  return {
    from: params.from as Hex,
    transactions: buildBatchTransactionsFromTempoTransactionCalls(params),
    // If no token is provided, we force a default one so we don't fall in
    // fee preference algo: https://docs.tempo.xyz/protocol/fees/spec-fee#fee-token-preferences
    gasFeeToken: params.feeToken || DEFAULT_FEE_TOKEN_ADDRESS,
    excludeNativeTokenForFee: true,
  };
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

export function isTempoSupportEnabledForChainId(chainId: Hex): boolean {
  return chainId && ENABLED_TEMPO_CHAIN_IDS_HEX.includes(chainId);
}

export function isTempoTransactionRequest(request: FinalAddTransactionRequest) {
  return request.transactionParams.type === TEMPO_TRANSACTION_TYPE;
}
