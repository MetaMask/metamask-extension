import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ETH } from '../../../helpers/constants/common';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';

import LowPriorityMessage from './low-priority-message';

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
      <LowPriorityMessage />
    </GasFeeContextProvider>,
    store,
  );
};

describe('LowPriorityMessage', () => {
  it('should returning warning message for low gas estimate', () => {
    render({ transaction: { userFeeLevel: 'low' } });
    expect(
      document.getElementsByClassName('actionable-message--warning'),
    ).toHaveLength(1);
  });

  it('should return null for gas estimate other than low', () => {
    render({ transaction: { userFeeLevel: 'high' } });
    expect(
      document.getElementsByClassName('actionable-message--warning'),
    ).toHaveLength(0);
  });
});
