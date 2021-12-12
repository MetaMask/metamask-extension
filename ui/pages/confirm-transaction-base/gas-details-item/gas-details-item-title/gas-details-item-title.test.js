import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { MAINNET_CHAIN_ID } from '../../../../../shared/constants/network';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';

import GasDetailsItemTitle from './gas-details-item-title';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

const render = () => {
  const store = configureStore({
    metamask: {
      provider: { chainId: MAINNET_CHAIN_ID },
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
    <GasFeeContextProvider transaction={{ txParams: {} }}>
      <GasDetailsItemTitle userAcknowledgedGasMissing={false} />
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
    });
  });
});
