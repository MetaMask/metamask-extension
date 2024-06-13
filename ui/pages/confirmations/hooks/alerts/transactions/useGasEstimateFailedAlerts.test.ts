import { TransactionMeta } from '@metamask/transaction-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';

const TRANSACTION_ID_MOCK = '123-456';

function buildState({
  currentConfirmation,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
  };
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const response = renderHookWithProvider(useGasEstimateFailedAlerts, state);

  return response.result.current;
}

describe('useGasEstimateFailedAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no simulation error data', () => {
    expect(
      runHook({
        currentConfirmation: {
          id: TRANSACTION_ID_MOCK,
          simulationFails: undefined,
        },
      }),
    ).toEqual([]);
  });

  it('returns alert if simulation error data', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        simulationFails: { debug: {} },
      },
    });

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.UpdateGas,
            label: 'Update gas limit',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        message:
          'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
        reason: 'Gas Estimation Failed',
        severity: Severity.Danger,
      },
    ]);
  });
});
