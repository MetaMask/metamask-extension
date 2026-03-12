import { TransactionParams } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

// Seem to be set by dApps only for batch calls.
// For single-txs, this type doesn't appear.
const TEMPO_TRANSACTION_TYPE: Hex = '0x76';

type TempoConfig = {
  perChainConfig: {
    [key: Hex]: {
      enabled: boolean;
      defaultFeeToken: Hex;
    };
  };
};

const TEMPO_CONFIG: TempoConfig = {
  perChainConfig: {
    '0x1079': {
      enabled: true,
      defaultFeeToken: '0x20c0000000000000000000000000000000000000',
    },
    '0xa5bf': {
      enabled: true,
      defaultFeeToken: '0x20c0000000000000000000000000000000000000',
    },
    '0x89': {
      // Polygon PoS. TODO: Remove once Tempo is 7702-ready.
      enabled: true,
      defaultFeeToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC (PoS)
    },
  },
} as const;

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

export function getTempoConfig() {
  return TEMPO_CONFIG;
}

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

export function isTempoTransactionType(params: TransactionParams) {
  return params.type === TEMPO_TRANSACTION_TYPE;
}

export function checkIsValidTempoTransaction(
  params: TransactionParams,
): asserts params is TempoTransactionParams {
  if (!isTempoTransactionType(params)) {
    throw new Error(
      `Tempo Transaction: Transaction doesn't have Tempo transaction type (0x76)`,
    );
  }
  if (typeof params.from !== 'string' || !params.from.startsWith('0x')) {
    throw new Error(`Tempo Transaction: Missing or invalid field 'from'`);
  }
  if (typeof params.chainId !== 'string' || !params.chainId.startsWith('0x')) {
    throw new Error(`Tempo Transaction: Missing or invalid field 'chainId'`);
  }
  if (
    !('calls' in params) ||
    !Array.isArray(params.calls) ||
    params.calls.length === 0
  ) {
    throw new Error(`Tempo Transaction: Missing or invalid field 'calls'`);
  }
}
