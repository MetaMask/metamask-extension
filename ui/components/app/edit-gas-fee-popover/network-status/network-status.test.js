import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/jest';
import { ETH } from '../../../../helpers/constants/common';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';

import NetworkStatus from './network-status';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  getGasFeeTimeEstimate: jest
    .fn()
    .mockImplementation(() => Promise.resolve('unknown')),
}));

const MOCK_FEE_ESTIMATE = {
  estimatedBaseFee: '50.0112',
};

const renderComponent = (props) => {
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
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
      ...props,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider>
      <NetworkStatus />
    </GasFeeContextProvider>,
    store,
  );
};

describe('NetworkStatus', () => {
  it('should renders labels', () => {
    renderComponent();
    expect(screen.queryByText('Base fee')).toBeInTheDocument();
    expect(screen.queryByText('Priority fee')).toBeInTheDocument();
  });

  it('should renders current base fee value rounded to 2 decimal places', () => {
    renderComponent();
    expect(
      screen.queryByText(
        `${parseFloat(MOCK_FEE_ESTIMATE.estimatedBaseFee).toFixed(2)} GWEI`,
      ),
    ).toBeInTheDocument();
  });

  it('should .01 as estimates base fee if estimated base fee is < .01', () => {
    renderComponent({
      gasFeeEstimates: {
        estimatedBaseFee: '0.0012',
      },
    });
    expect(screen.queryByText('0.01 GWEI')).toBeInTheDocument();
  });
});
