import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';

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
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useIsGasSponsored } from '../../gas/useIsGasSponsored';
import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';

jest.mock('../../gas/useIsGasSponsored');

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

const GAS_ALERT = {
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
};

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useGasEstimateFailedAlerts,
    state,
  );

  return response.result.current;
}

describe('useGasEstimateFailedAlerts', () => {
  const useIsGasSponsoredMock = jest.mocked(useIsGasSponsored);

  beforeEach(() => {
    jest.resetAllMocks();

    useIsGasSponsoredMock.mockReturnValue(false);
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
    expect(alerts[0]).toMatchObject(GAS_ALERT);
    expect(alerts[0].content).toBeDefined();
  });

  it('renders the gas revert reason in the alert message', () => {
    const state = getMockConfirmStateForTransaction({
      ...CONFIRMATION_MOCK,
      simulationFails: { debug: {} },
      revert: {
        gas: {
          message: 'execution reverted: insufficient funds for gas',
        },
      },
    });
    const alerts = runHook(state);

    renderWithProvider(alerts[0].content, configureStore()(state));

    expect(screen.getByTestId('alert-modal__selected-alert')).toHaveTextContent(
      'unable to provide an accurate fee',
    );
    expect(
      screen.getByTestId('gas-estimate-failed-revert-reason-message'),
    ).toHaveTextContent('execution reverted: insufficient funds for gas');
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

  it('returns no alerts if simulation fails but network is sponsored', () => {
    useIsGasSponsoredMock.mockReturnValue(true);
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          isGasFeeSponsored: true,
          simulationFails: { debug: {} },
        }),
      ),
    ).toEqual([]);
  });
});
