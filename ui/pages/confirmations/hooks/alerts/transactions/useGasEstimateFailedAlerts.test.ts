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
import { useIsGaslessSupported } from '../../gas/useIsGaslessSupported';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';

jest.mock('../../gas/useIsGaslessSupported');

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
  // content: <GasEstimateFailedAlertMessage />,
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
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);

  beforeEach(() => {
    jest.resetAllMocks();

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });
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

  it('returns no alerts if simulation fails but transaction is gasless or sponsored', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: true,
      pending: false,
    });
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

  it('returns no alerts when gasless support check is pending', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: true,
    });
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

  it('returns alert if simulation fails and sponsorship is unsupported', () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: false,
      pending: false,
    });
    const alerts = runHook(
      getMockConfirmStateForTransaction({
        ...CONFIRMATION_MOCK,
        isGasFeeSponsored: true,
        simulationFails: { debug: {} },
      }),
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject(GAS_ALERT);
    expect(alerts[0].content).toBeDefined();
  });
});
