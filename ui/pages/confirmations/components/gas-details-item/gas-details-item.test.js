import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';

import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';

import GasDetailsItem from './gas-details-item';

jest.mock('../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

const render = async ({ contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      gasFeeEstimates:
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
      gasFeeEstimatesByChainId: {
        ...mockState.metamask.gasFeeEstimatesByChainId,
        '0x5': {
          ...mockState.metamask.gasFeeEstimatesByChainId['0x5'],
          gasFeeEstimates:
            mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
        },
      },
      ...contextProps,
    },
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider
          transaction={{
            txParams: {
              gas: '0x5208',
            },
            userFeeLevel: 'medium',
          }}
          {...contextProps}
        >
          <GasDetailsItem userAcknowledgedGasMissing={false} />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('GasDetailsItem', () => {
  it('should render label', async () => {
    await render();
    await waitFor(() => {
      expect(screen.queryAllByText('Market')[0]).toBeInTheDocument();
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should show warning icon if estimates are high', async () => {
    await render({
      contextProps: { transaction: { txParams: {}, userFeeLevel: 'high' } },
    });
    await waitFor(() => {
      expect(screen.queryByText('⚠ Max fee:')).toBeInTheDocument();
    });
  });

  it('should show warning icon if dapp estimates are high', async () => {
    await render({
      contextProps: {
        gasFeeEstimates: {
          high: {
            suggestedMaxPriorityFeePerGas: '1',
          },
        },
        gasFeeEstimatesByChainId: {
          ...mockState.metamask.gasFeeEstimatesByChainId,
          '0x5': {
            gasFeeEstimates: {
              high: {
                suggestedMaxPriorityFeePerGas: '1',
              },
            },
          },
        },
        transaction: {
          txParams: {
            gas: '0x52081',
            maxFeePerGas: '0x38D7EA4C68000',
          },
          userFeeLevel: 'medium',
          dappSuggestedGasFees: {
            maxPriorityFeePerGas: '0x38D7EA4C68000',
            maxFeePerGas: '0x38D7EA4C68000',
          },
        },
      },
    });
    await waitFor(() => {
      expect(screen.queryByText('⚠ Max fee:')).toBeInTheDocument();
    });
  });

  it('should not show warning icon if estimates are not high', async () => {
    await render({
      contextProps: { transaction: { txParams: {}, userFeeLevel: 'low' } },
    });
    await waitFor(() => {
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    });
  });

  it('should return null if there is simulationError and user has not acknowledged gasMissing warning', async () => {
    const { container } = await render({
      contextProps: {
        transaction: {
          txParams: {},
          simulationFails: true,
          userFeeLevel: 'low',
        },
      },
    });
    expect(container.innerHTML).toHaveLength(0);
  });

  it('should not return null even if there is simulationError if user acknowledged gasMissing warning', async () => {
    await render();
    await waitFor(() => {
      expect(screen.queryAllByText('Market')[0]).toBeInTheDocument();
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should render gas fee details', async () => {
    await render();
    await waitFor(() => {
      expect(screen.queryAllByTitle('0.00147 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should render gas fee details if maxPriorityFeePerGas is 0', async () => {
    await render({
      contextProps: {
        transaction: {
          txParams: {
            gas: '0x5208',
            maxFeePerGas: '0x59682f10',
            maxPriorityFeePerGas: '0',
          },
          simulationFails: false,
          userFeeLevel: 'low',
        },
      },
    });
    await waitFor(() => {
      expect(screen.queryAllByTitle('0.001113 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should render gas fee details if maxPriorityFeePerGas is undefined', async () => {
    await render({
      contextProps: {
        transaction: {
          txParams: {
            gas: '0x5208',
            maxFeePerGas: '0x59682f10',
          },
          simulationFails: false,
          userFeeLevel: 'low',
        },
      },
    });
    await waitFor(() => {
      expect(screen.queryAllByTitle('0.001113 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });
});
