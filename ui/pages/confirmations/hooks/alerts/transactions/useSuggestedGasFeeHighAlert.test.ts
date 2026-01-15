import {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';

import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useSuggestedGasFeeHighAlert } from './useSuggestedGasFeeHighAlert';

// Market medium estimation: suggestedMaxFeePerGas = '70' GWEI
// 20% threshold = 70 * 1.2 = 84 GWEI
// So anything at or above 84 GWEI should trigger the alert
const FEE_MARKET_ESTIMATES = {
  low: {
    minWaitTimeEstimate: 180000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: '3',
    suggestedMaxFeePerGas: '53',
  },
  medium: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: '7',
    suggestedMaxFeePerGas: '70',
  },
  high: {
    minWaitTimeEstimate: 0,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: '10',
    suggestedMaxFeePerGas: '100',
  },
  estimatedBaseFee: '50',
};

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useSuggestedGasFeeHighAlert,
    state,
  );

  return response.result.current;
}

describe('useSuggestedGasFeeHighAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook(getMockConfirmState())).toEqual([]);
  });

  it('returns no alerts if no dapp suggested gas fees', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            dappSuggestedGasFees: undefined,
          },
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x5': {
                  gasFeeEstimates: FEE_MARKET_ESTIMATES,
                  gasEstimateType: 'fee-market',
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns no alerts if no market estimation available', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            dappSuggestedGasFees: {
              maxFeePerGas: '0x174876e800',
              maxPriorityFeePerGas: '0x174876e800',
            },
            txParams: {
              ...CONFIRMATION_MOCK.txParams,
              maxFeePerGas: '0x174876e800',
              maxPriorityFeePerGas: '0x174876e800',
            } as TransactionParams,
          },
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x5': {
                  gasFeeEstimates: {},
                  gasEstimateType: 'none',
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns no alerts if dapp fee is within 20% of market estimation', () => {
    // Market medium is 70 GWEI, 20% higher is 84 GWEI
    // 80 GWEI = 0x12A05F2000 in WEI (should not trigger alert)
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            dappSuggestedGasFees: {
              maxFeePerGas: '0x12a05f2000',
              maxPriorityFeePerGas: '0x12a05f2000',
            },
            txParams: {
              ...CONFIRMATION_MOCK.txParams,
              maxFeePerGas: '0x12a05f2000',
              maxPriorityFeePerGas: '0x12a05f2000',
            } as TransactionParams,
          },
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x5': {
                  gasFeeEstimates: FEE_MARKET_ESTIMATES,
                  gasEstimateType: 'fee-market',
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns alert if dapp fee is exactly 20% higher than market estimation (boundary case)', () => {
    // Market medium is 70 GWEI, 20% higher is exactly 84 GWEI
    // 84 GWEI = 0x138eca4800 in WEI (should trigger alert at boundary)
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          dappSuggestedGasFees: {
            maxFeePerGas: '0x138eca4800',
            maxPriorityFeePerGas: '0x138eca4800',
          },
          txParams: {
            ...CONFIRMATION_MOCK.txParams,
            maxFeePerGas: '0x138eca4800',
            maxPriorityFeePerGas: '0x138eca4800',
          } as TransactionParams,
        },
        {
          metamask: {
            gasFeeEstimatesByChainId: {
              '0x5': {
                gasFeeEstimates: FEE_MARKET_ESTIMATES,
                gasEstimateType: 'fee-market',
              },
            },
          },
        },
      ),
    );

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.ShowGasFeeModal,
            label: 'Edit network fee',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'suggestedGasFeeHigh',
        message:
          'This site is suggesting a higher network fee than necessary. Edit the network fee to pay less.',
        reason: 'High site fee',
        severity: Severity.Warning,
      },
    ]);
  });

  it('returns alert if dapp fee is more than 20% higher than market estimation (EIP-1559)', () => {
    // Market medium is 70 GWEI, 20% higher is 84 GWEI
    // 100 GWEI = 0x174876E800 in WEI (should trigger alert)
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          dappSuggestedGasFees: {
            maxFeePerGas: '0x174876e800',
            maxPriorityFeePerGas: '0x174876e800',
          },
          txParams: {
            ...CONFIRMATION_MOCK.txParams,
            maxFeePerGas: '0x174876e800',
            maxPriorityFeePerGas: '0x174876e800',
          } as TransactionParams,
        },
        {
          metamask: {
            gasFeeEstimatesByChainId: {
              '0x5': {
                gasFeeEstimates: FEE_MARKET_ESTIMATES,
                gasEstimateType: 'fee-market',
              },
            },
          },
        },
      ),
    );

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.ShowGasFeeModal,
            label: 'Edit network fee',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'suggestedGasFeeHigh',
        message:
          'This site is suggesting a higher network fee than necessary. Edit the network fee to pay less.',
        reason: 'High site fee',
        severity: Severity.Warning,
      },
    ]);
  });

  it('returns alert if dapp gas price is more than 20% higher than market estimation (legacy)', () => {
    // Market medium is 70 GWEI, 20% higher is 84 GWEI
    // 100 GWEI = 0x174876E800 in WEI (should trigger alert)
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          dappSuggestedGasFees: {
            gasPrice: '0x174876e800',
          },
          txParams: {
            ...CONFIRMATION_MOCK.txParams,
            gasPrice: '0x174876e800',
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
          } as TransactionParams,
        },
        {
          metamask: {
            gasFeeEstimatesByChainId: {
              '0x5': {
                gasFeeEstimates: FEE_MARKET_ESTIMATES,
                gasEstimateType: 'fee-market',
              },
            },
          },
        },
      ),
    );

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.ShowGasFeeModal,
            label: 'Edit network fee',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'suggestedGasFeeHigh',
        message:
          'This site is suggesting a higher network fee than necessary. Edit the network fee to pay less.',
        reason: 'High site fee',
        severity: Severity.Warning,
      },
    ]);
  });

  it('returns no alerts if transaction params have been modified from dapp suggested', () => {
    // Create a confirmation where txParams differs from dappSuggestedGasFees
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            dappSuggestedGasFees: {
              maxFeePerGas: '0x174876e800', // 100 GWEI
              maxPriorityFeePerGas: '0x174876e800',
            },
            txParams: {
              ...CONFIRMATION_MOCK.txParams,
              maxFeePerGas: '0x1043561a80', // Different value (70 GWEI)
              maxPriorityFeePerGas: '0x1a13b8600', // Different value
            } as TransactionParams,
          },
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x5': {
                  gasFeeEstimates: FEE_MARKET_ESTIMATES,
                  gasEstimateType: 'fee-market',
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns no alerts if user is paying gas with a non-native token', () => {
    // Even with high dapp suggested fee, alert should not show for non-native gas token
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            // USDC token address - non-native gas token
            selectedGasFeeToken:
              '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const,
            dappSuggestedGasFees: {
              maxFeePerGas: '0x174876e800', // 100 GWEI (would trigger alert)
              maxPriorityFeePerGas: '0x174876e800',
            },
            txParams: {
              ...CONFIRMATION_MOCK.txParams,
              maxFeePerGas: '0x174876e800',
              maxPriorityFeePerGas: '0x174876e800',
            } as TransactionParams,
          },
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x5': {
                  gasFeeEstimates: FEE_MARKET_ESTIMATES,
                  gasEstimateType: 'fee-market',
                },
              },
            },
          },
        ),
      ),
    ).toEqual([]);
  });
});
