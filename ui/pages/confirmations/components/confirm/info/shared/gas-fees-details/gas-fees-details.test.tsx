/* eslint-disable @typescript-eslint/naming-convention */
import { act, waitFor } from '@testing-library/react';
import React from 'react';

import {
  SimulationError,
  TransactionContainerType,
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getGasFeeTimeEstimate } from '../../../../../../../store/actions';
import configureStore from '../../../../../../../store/store';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { GasFeesDetails } from './gas-fees-details';

const mockUpdateTransactionEventFragment = jest.fn();

jest.mock('../../../../../hooks/useTransactionEventFragment', () => ({
  useTransactionEventFragment: () => ({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  }),
}));

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
  chainId,
  isEnforcedSimulations,
  usdConversionRate = 556.12,
}: {
  isAdvanced?: boolean;
  selectedGasFeeToken?: Hex;
  simulationFails?: SimulationError;
  userFeeLevel?: UserFeeLevel;
  chainId?: Hex;
  isEnforcedSimulations?: boolean;
  usdConversionRate?: number;
} = {}) {
  const confirmation = genUnapprovedContractInteractionConfirmation({
    chainId,
    selectedGasFeeToken,
    simulationFails,
    userFeeLevel,
  }) as TransactionMeta;

  if (isEnforcedSimulations) {
    confirmation.containerTypes = [
      TransactionContainerType.EnforcedSimulations,
    ];
    confirmation.txParamsOriginal = { ...confirmation.txParams };
    confirmation.txParams.gas = '0x156ee';
  } else if (isEnforcedSimulations === false) {
    confirmation.containerTypes = [];
  }

  return configureStore(
    getMockConfirmStateForTransaction(confirmation, {
      metamask: {
        currencyRates: {
          ETH: {
            conversionRate: 556.12,
            usdConversionRate,
          },
          SepoliaETH: {
            conversionRate: 556.12,
            usdConversionRate,
          },
        },
        preferences: {
          showFiatInTestnets: true,
          showConfirmationAdvancedDetails: isAdvanced ?? false,
        },
      },
    }),
  );
}

describe('<GasFeesDetails />', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );
  });

  it('renders fiat gas fee and records zero added fee when enforced simulations are disabled', async () => {
    const { getByText } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({ isEnforcedSimulations: false }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(getByText('$0.07')).toBeInTheDocument();
    expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
      {
        properties: {
          enforced_simulation_added_network_fee_usd: 0,
        },
      },
      expect.any(String),
    );
  });

  it('renders max fee if advanced', async () => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({
        isAdvanced: true,
        chainId: CHAIN_IDS.SEPOLIA,
        isEnforcedSimulations: true,
      }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(getByTestId('gas-fee-details-max-fee')).toBeInTheDocument();
    expect(getByTestId('added-protection-network-fee')).toHaveTextContent(
      messages.addedProtectionIncludesNetworkFee.message.replace('$1', '$0.07'),
    );
    await waitFor(() => {
      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        {
          properties: {
            enforced_simulation_added_network_fee_usd: expect.any(Number),
          },
        },
        expect.any(String),
      );
    });
  });

  it('does not render max fee if advanced and selected gas fee token', async () => {
    const { queryByTestId } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({
        isAdvanced: true,
        isEnforcedSimulations: true,
        selectedGasFeeToken: '0x123',
        usdConversionRate: 0,
      }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByTestId('gas-fee-details-max-fee')).toBeNull();
    expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
      {
        properties: {
          enforced_simulation_added_network_fee_usd: 0,
        },
      },
      expect.any(String),
    );
  });

  it('does not render gas timing if selected gas fee token', async () => {
    const { queryByText } = renderWithConfirmContextProvider(
      <GasFeesDetails />,
      getStore({ isAdvanced: true, selectedGasFeeToken: '0x123' }),
    );

    await act(async () => {
      // Intentionally empty
    });

    expect(queryByText(messages.speed.message)).not.toBeInTheDocument();
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
