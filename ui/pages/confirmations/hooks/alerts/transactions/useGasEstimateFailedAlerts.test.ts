import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';

import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useGasEstimateFailedAlerts,
    state,
  );

  return response.result.current;
}

describe('useGasEstimateFailedAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook(getMockConfirmState())).toEqual([]);
  });

  it('returns no alerts if no simulation error data', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationFails: undefined,
        }),
      ),
    ).toEqual([]);
  });

  it('returns alert if simulation error data', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction({
        ...CONFIRMATION_MOCK,
        simulationFails: { debug: {} },
      }),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      actions: [
        {
          key: AlertActionKey.ShowAdvancedGasFeeModal,
          label: 'Update gas limit',
        },
      ],
      field: RowAlertKey.EstimatedFee,
      key: 'gasEstimateFailed',
      reason: 'Inaccurate fee',
      severity: Severity.Warning,
    });
    expect(alerts[0].content).toBeDefined();
  });

  it('returns no alerts if simulation fails but userFeeLevel is CUSTOM', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationFails: { debug: {} },
          userFeeLevel: UserFeeLevel.CUSTOM,
        }),
      ),
    ).toEqual([]);
  });
});
