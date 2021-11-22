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

const render = (props) => {
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
    <GasFeeContextProvider {...props} transaction={{ txParams: {}, ...props }}>
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
      expect(screen.queryByText('ETH')).toBeInTheDocument();
    });
  });

  it('should show warning icon if estimates are high', async () => {
    render({ userFeeLevel: 'high' });
    await waitFor(() => {
      expect(screen.queryByText('⚠ Max fee:')).toBeInTheDocument();
    });
  });

  it('should not show warning icon if estimates are not high', async () => {
    render({ userFeeLevel: 'low' });
    await waitFor(() => {
      expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    });
  });

  it('should return null if there is simulationError and user has not selected proceed anyway', () => {
    const { container } = render({
      userFeeLevel: 'low',
      simulationFails: true,
    });
    expect(container.innerHTML).toHaveLength(0);
  });

  it('should not return null even if there is simulationError if user selected proceedAnyways', async () => {
    render();
    await waitFor(() => {
      expect(screen.queryByText('Gas')).toBeInTheDocument();
    });
  });
});
