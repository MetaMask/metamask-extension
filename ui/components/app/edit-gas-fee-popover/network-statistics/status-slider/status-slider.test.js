import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../../../test/jest';
import { ETH } from '../../../../../helpers/constants/common';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import StatusSlider from './status-slider';

jest.mock('../../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  getGasFeeTimeEstimate: jest
    .fn()
    .mockImplementation(() => Promise.resolve('unknown')),
}));

const renderComponent = () => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
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
    <GasFeeContextProvider>
      <StatusSlider />
    </GasFeeContextProvider>,
    store,
  );
};

describe('NetworkStatus', () => {
  it('should renders stable for statusValue > 0.33 and <= 0.66', () => {
    renderComponent();
    expect(screen.queryByText('Stable')).toBeInTheDocument();
  });
});
