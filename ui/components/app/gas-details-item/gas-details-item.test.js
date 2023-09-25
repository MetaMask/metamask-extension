import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { GasEstimateTypes } from '../../../../shared/constants/gas';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';

import GasDetailsItem from './gas-details-item';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

const render = ({ contextProps } = {}) => {
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
      gasFeeEstimates: mockEstimates[GasEstimateTypes.feeMarket],
      ...contextProps,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        txParams: {
          gas: '0x5208',
          maxFeePerGas: '0x59682f10',
          maxPriorityFeePerGas: '0x59682f00',
        },
        userFeeLevel: 'medium',
      }}
      {...contextProps}
    >
      <GasDetailsItem userAcknowledgedGasMissing={false} />
    </GasFeeContextProvider>,
    store,
  );
};

describe('GasDetailsItem', () => {
  it('should render label', async () => {
    render();
    await waitFor(() => {
      expect(screen.queryByText('Gas')).toBeInTheDocument();
      expect(screen.queryByText('(estimated)')).toBeInTheDocument();
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should show warning icon if estimates are high', async () => {
    render({
      contextProps: { transaction: { txParams: {}, userFeeLevel: 'high' } },
    });
    await waitFor(() => {
      expect(screen.queryByText('⚠ Max fee:')).toBeInTheDocument();
    });
  });

  it('should show warning icon if dapp estimates are high', async () => {
    render({
      contextProps: {
        gasFeeEstimates: {
          high: {
            suggestedMaxPriorityFeePerGas: '1',
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
    render({
      contextProps: { transaction: { txParams: {}, userFeeLevel: 'low' } },
    });
    await waitFor(() => {
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    });
  });

  it('should return null if there is simulationError and user has not acknowledged gasMissing warning', () => {
    const { container } = render({
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
    render();
    await waitFor(() => {
      expect(screen.queryByText('Gas')).toBeInTheDocument();
    });
  });

  it('should render gas fee details', async () => {
    render();
    await waitFor(() => {
      expect(screen.queryAllByTitle('0.0000315 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should render gas fee details if maxPriorityFeePerGas is 0', async () => {
    render({
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
      expect(screen.queryAllByTitle('0.0000315 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });

  it('should render gas fee details if maxPriorityFeePerGas is undefined', async () => {
    render({
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
      expect(screen.queryAllByTitle('0.0000315 ETH').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
    });
  });
});
