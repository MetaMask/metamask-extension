import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { ETH } from '../../../helpers/constants/common';
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

const render = ({ componentProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      provider: {},
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x176e5b6f173ebe66',
        },
      },
      selectedAddress: '0xAddress',
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider transaction={{ txParams: {} }} {...contextProps}>
      <GasDetailsItem userAcknowledgedGasMissing={false} {...componentProps} />
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
      expect(screen.queryByText('ETH')).toBeInTheDocument();
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

  it('should should render gas fee details', async () => {
    render({
      componentProps: {
        hexMinimumTransactionFee: '0x1ca62a4f7800',
        hexMaximumTransactionFee: '0x290ee75e3d900',
      },
    });
    await waitFor(() => {
      expect(screen.queryByTitle('0.0000315 ETH')).toBeInTheDocument();
      expect(screen.queryByText('ETH')).toBeInTheDocument();
      expect(screen.queryByTitle('0.0007223')).toBeInTheDocument();
    });
  });
});
