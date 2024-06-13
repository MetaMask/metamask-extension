import { TransactionMeta } from '@metamask/transaction-controller';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { NetworkCongestionThresholds } from '../../../../../../shared/constants/gas';
import { useNetworkBusyAlerts } from './useNetworkBusyAlerts';

const TRANSACTION_ID_MOCK = '123-456';

const EXPECTED_ALERT = {
  field: RowAlertKey.EstimatedFee,
  key: 'networkBusy',
  message:
    'Network is busy. Gas prices are high and estimates are less accurate.',
  reason: 'Network Busy',
  severity: Severity.Warning,
};

function buildState({
  currentConfirmation,
  gasFeeEstimates,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  gasFeeEstimates?: Partial<GasFeeEstimates>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      gasFeeEstimatesByChainId: {
        '0x5': { gasFeeEstimates },
      },
    },
  };
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const response = renderHookWithProvider(useNetworkBusyAlerts, state);

  return response.result.current;
}

describe('useNetworkBusyAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if confirmation has no chain ID', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        chainId: undefined,
      },
      gasFeeEstimates: {
        networkCongestion: NetworkCongestionThresholds.busy,
      },
    });

    expect(alerts).toEqual([]);
  });

  it('returns no alerts if network congestion less than threshold', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        chainId: '0x5',
      },
      gasFeeEstimates: {
        networkCongestion: NetworkCongestionThresholds.busy - 0.01,
      },
    });

    expect(alerts).toEqual([]);
  });

  it('returns alert if network congestion at threshold', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        chainId: '0x5',
      },
      gasFeeEstimates: {
        networkCongestion: NetworkCongestionThresholds.busy,
      },
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });

  it('returns alert if network congestion greater than threshold', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        chainId: '0x5',
      },
      gasFeeEstimates: {
        networkCongestion: NetworkCongestionThresholds.busy + 0.01,
      },
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });
});
