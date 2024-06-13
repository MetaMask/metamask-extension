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
const TRANSACTION_ID_MOCK_2 = '456-789';

const CONFIRMATION_MOCK = {
  id: TRANSACTION_ID_MOCK,
};

function buildState({
  currentConfirmation,
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      transactions: transaction ? [transaction] : [],
    },
  };
}

function runHook({
  currentConfirmation,
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  const state = buildState({ currentConfirmation, transaction });
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

  it('returns no alerts if no transaction matching confirmation', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transaction: {
          id: TRANSACTION_ID_MOCK_2,
          simulationFails: { debug: {} },
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has no simulation error data', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transaction: { id: TRANSACTION_ID_MOCK, simulationFails: undefined },
      }),
    ).toEqual([]);
  });

  it('returns alert if transaction has simulation error data', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transaction: { id: TRANSACTION_ID_MOCK, simulationFails: { debug: {} } },
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
