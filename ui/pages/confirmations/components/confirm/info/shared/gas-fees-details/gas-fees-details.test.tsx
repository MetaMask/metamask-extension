import { act } from '@testing-library/react';
import React from 'react';

import {
  SimulationError,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getGasFeeTimeEstimate } from '../../../../../../../store/actions';
import configureStore from '../../../../../../../store/store';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { GasFeesDetails } from './gas-fees-details';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn(),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

function getStore({
  isAdvanced,
  selectedGasFeeToken,
  simulationFails,
  userFeeLevel,
}: {
  isAdvanced?: boolean;
  selectedGasFeeToken?: Hex;
  simulationFails?: SimulationError;
  userFeeLevel?: UserFeeLevel;
} = {}) {
  return configureStore(
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        selectedGasFeeToken,
        simulationFails,
        userFeeLevel,
      }),
      {
        metamask: {
          preferences: {
            showFiatInTestnets: true,
            showConfirmationAdvancedDetails: isAdvanced ?? false,
          },
        },
      },
    ),
  );
}

describe('<GasFeesDetails />', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );
  });

  it('renders fiat gas fee', async () => {
    const { getByText } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore(),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(getByText('$0.04')).toBeInTheDocument();
  });

  it('renders max fee if advanced', async () => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({ isAdvanced: true }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(getByTestId('gas-fee-details-max-fee')).toBeInTheDocument();
  });

  it('does not render max fee if advanced and selected gas fee token', async () => {
    const { queryByTestId } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({ isAdvanced: true, selectedGasFeeToken: '0x123' }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByTestId('gas-fee-details-max-fee')).toBeNull();
  });

  it('does not render gas timing if selected gas fee token', async () => {
    const { queryByText } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({ isAdvanced: true, selectedGasFeeToken: '0x123' }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByText('Speed')).not.toBeInTheDocument();
  });

  describe('when estimation failed', () => {
    it('does not render max fee if advanced and estimation failed', async () => {
      const { queryByTestId } = renderWithConfirmContextProvider(
        <GasFeesDetails />,
        getStore({
          isAdvanced: true,
          simulationFails: { debug: {} } as SimulationError,
          userFeeLevel: UserFeeLevel.MEDIUM,
        }),
      );

      await act(async () => {
        // Intentionally empty
      });

      expect(queryByTestId('gas-fee-details-max-fee')).toBeNull();
    });

    it('renders max fee if advanced and userFeeLevel is CUSTOM even with simulation failure', async () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <GasFeesDetails />,
        getStore({
          isAdvanced: true,
          simulationFails: { debug: {} } as SimulationError,
          userFeeLevel: UserFeeLevel.CUSTOM,
        }),
      );

      await act(async () => {
        // Intentionally empty
      });

      expect(getByTestId('gas-fee-details-max-fee')).toBeInTheDocument();
    });

    it('renders gas timing even when estimation failed', async () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <GasFeesDetails />,
        getStore({
          simulationFails: { debug: {} } as SimulationError,
          userFeeLevel: UserFeeLevel.MEDIUM,
        }),
      );

      await act(async () => {
        // Intentionally empty
      });

      expect(getByTestId('gas-fee-details-speed')).toBeInTheDocument();
    });
  });
});
