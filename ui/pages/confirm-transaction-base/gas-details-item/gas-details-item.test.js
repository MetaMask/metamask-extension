import React from 'react';
import { screen } from '@testing-library/react';

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
    <GasFeeContextProvider {...props}>
      <GasDetailsItem txData={{}} {...props} />
    </GasFeeContextProvider>,
    store,
  );
};

describe('GasDetailsItem', () => {
  it('should render label', () => {
    render();
    expect(screen.queryByText('Gas')).toBeInTheDocument();
    expect(screen.queryByText('(estimated)')).toBeInTheDocument();
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    expect(screen.queryByText('ETH')).toBeInTheDocument();
  });

  it('should show warning icon if estimates are high', () => {
    render({ defaultEstimateToUse: 'high' });
    expect(screen.queryByText('⚠ Max fee:')).toBeInTheDocument();
  });

  it('should not show warning icon if estimates are not high', () => {
    render({ defaultEstimateToUse: 'low' });
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
  });
});
