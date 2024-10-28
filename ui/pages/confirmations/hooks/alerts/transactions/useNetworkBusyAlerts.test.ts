import { TransactionMeta } from '@metamask/transaction-controller';

import { NetworkCongestionThresholds } from '../../../../../../shared/constants/gas';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useNetworkBusyAlerts } from './useNetworkBusyAlerts';

const contractInteraction = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
});

const EXPECTED_ALERT = {
  field: RowAlertKey.EstimatedFee,
  key: 'networkBusy',
  message: 'Gas prices are high and estimates are less accurate.',
  reason: 'Network is busy',
  severity: Severity.Warning,
};

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useNetworkBusyAlerts,
    state,
  );

  return response.result.current;
}

describe('useNetworkBusyAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook(getMockConfirmState())).toEqual([]);
  });

  it('returns no alerts if confirmation has no chain ID', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...contractInteraction,
          chainId: undefined,
        } as unknown as TransactionMeta,
        {
          metamask: {
            gasFeeEstimatesByChainId: {
              '0x5': {
                gasFeeEstimates: {
                  networkCongestion: NetworkCongestionThresholds.busy,
                },
              },
            },
          },
        },
      ),
    );

    expect(alerts).toEqual([]);
  });

  it('returns no alerts if network congestion less than threshold', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(contractInteraction, {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x5': {
              gasFeeEstimates: {
                networkCongestion: NetworkCongestionThresholds.busy - 0.01,
              },
            },
          },
        },
      }),
    );

    expect(alerts).toEqual([]);
  });

  it('returns alert if network congestion at threshold', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(contractInteraction, {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x5': {
              gasFeeEstimates: {
                networkCongestion: NetworkCongestionThresholds.busy,
              },
            },
          },
        },
      }),
    );

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });

  it('returns alert if network congestion greater than threshold', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(contractInteraction, {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x5': {
              gasFeeEstimates: {
                networkCongestion: NetworkCongestionThresholds.busy + 0.01,
              },
            },
          },
        },
      }),
    );

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });
});
