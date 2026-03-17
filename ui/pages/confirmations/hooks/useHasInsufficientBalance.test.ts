import {
  TransactionMeta,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import { ApprovalType, toHex } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import { mockNetworkState } from '../../../../test/stub/networks';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmState } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { useHasInsufficientBalance } from './useHasInsufficientBalance';

const TRANSACTION_ID_MOCK = '123-456';
const TRANSACTION_MOCK = {
  ...genUnapprovedContractInteractionConfirmation({
    chainId: '0x5',
  }),
  id: TRANSACTION_ID_MOCK,
  txParams: {
    from: '0x123',
    value: '0x2',
    maxFeePerGas: '0x2',
    gas: '0x3',
  } as TransactionParams,
} as TransactionMeta;

function buildState({
  balance,
  currentConfirmation = TRANSACTION_MOCK,
  transaction = TRANSACTION_MOCK,
  selectedNetworkClientId,
  chainId,
  metamaskOverrides = {},
}: {
  balance?: number;
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
  selectedNetworkClientId?: string;
  chainId?: string;
  metamaskOverrides?: Record<string, unknown>;
} = {}) {
  const accountAddress = transaction?.txParams?.from as string;
  const txChainId = chainId ?? transaction?.chainId ?? '0x5';

  let pendingApprovals = {};
  if (currentConfirmation) {
    pendingApprovals = {
      [currentConfirmation.id as string]: {
        id: currentConfirmation.id,
        type: ApprovalType.Transaction,
      },
    };
  }

  return getMockConfirmState({
    metamask: {
      selectedNetworkClientId: selectedNetworkClientId ?? 'goerli',
      pendingApprovals,
      accountsByChainId: {
        [txChainId]: {
          [accountAddress]: { balance: toHex(balance ?? 0) },
        },
      },
      transactions: transaction ? [transaction] : [],
      ...metamaskOverrides,
    },
  });
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const response = renderHookWithConfirmContextProvider(
    () => useHasInsufficientBalance(),
    state,
  );

  return response.result.current;
}

describe('useHasInsufficientBalance', () => {
  it('returns false if balance sufficient for value + fee', () => {
    const result = runHook({ balance: 900000000000 });
    expect(result.hasInsufficientBalance).toBe(false);
    expect(result.nativeCurrency).toBe('ETH');
  });

  it('returns true if balance insufficient for value + fee', () => {
    const result = runHook({ balance: 0 });
    expect(result.hasInsufficientBalance).toBe(true);
  });

  it('sums nested transaction values correctly', () => {
    const BATCH_TRANSACTION_MOCK = {
      ...TRANSACTION_MOCK,
      nestedTransactions: [
        {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x3B9ACA00',
          type: TransactionType.simpleSend,
        },
        {
          to: '0x1234567890123456789012345678901234567891',
          value: '0x1DCD6500',
          type: TransactionType.simpleSend,
        },
      ],
    };
    const result = runHook({
      currentConfirmation: BATCH_TRANSACTION_MOCK as Partial<TransactionMeta>,
      transaction: BATCH_TRANSACTION_MOCK as Partial<TransactionMeta>,
      balance: 0x10,
    });
    expect(result.hasInsufficientBalance).toBe(true);
  });

  it('returns nativeCurrency from evmNetworks if multichain missing', () => {
    const result = runHook();
    expect(result.nativeCurrency).toBe('ETH');
  });

  it('returns 0x0 if balance missing', () => {
    const result = runHook({ balance: undefined });
    expect(result.hasInsufficientBalance).toBe(true);
  });

  it('returns false when transaction chain differs from selected chain but balance is sufficient for transaction chain fee', () => {
    const networkState = mockNetworkState(
      {
        chainId: CHAIN_IDS.MAINNET,
        metadata: {
          EIPS: { 1559: true },
          status: NetworkStatus.Available,
        },
      },
      {
        chainId: CHAIN_IDS.BASE,
        metadata: {
          EIPS: { 1559: true },
          status: NetworkStatus.Available,
        },
      },
    );
    const transactionOnBase = {
      ...TRANSACTION_MOCK,
      chainId: CHAIN_IDS.BASE,
      txParams: {
        ...TRANSACTION_MOCK.txParams,
        value: '0x0',
        gas: '0x5208',
      },
    };
    const baseChainGasLow = {
      estimatedBaseFee: '1',
      high: {
        suggestedMaxFeePerGas: '2',
        suggestedMaxPriorityFeePerGas: '1',
      },
      medium: {
        suggestedMaxFeePerGas: '2',
        suggestedMaxPriorityFeePerGas: '1',
      },
      low: {
        suggestedMaxFeePerGas: '1',
        suggestedMaxPriorityFeePerGas: '1',
      },
    };
    const result = runHook({
      transaction: transactionOnBase as Partial<TransactionMeta>,
      currentConfirmation: transactionOnBase as Partial<TransactionMeta>,
      chainId: CHAIN_IDS.BASE,
      balance: 1e18,
      selectedNetworkClientId: networkState.selectedNetworkClientId,
      metamaskOverrides: {
        ...networkState,
        gasFeeEstimates: {
          estimatedBaseFee: '100',
          medium: {
            suggestedMaxFeePerGas: '150',
            suggestedMaxPriorityFeePerGas: '8',
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        gasFeeEstimatesByChainId: {
          [CHAIN_IDS.BASE]: {
            gasFeeEstimates: baseChainGasLow,
            gasEstimateType: GasEstimateTypes.feeMarket,
          },
        },
        currencyRates: { ETH: { conversionRate: 1 } },
        currentCurrency: 'usd',
      },
    });
    expect(result.hasInsufficientBalance).toBe(false);
  });
});
