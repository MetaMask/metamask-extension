import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { ETH } from '../../../../helpers/constants/common';
import configureStore from '../../../../store/store';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';

import EditGasItem from './edit-gas-item';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const MOCK_FEE_ESTIMATE = {
  low: {
    minWaitTimeEstimate: 360000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: '3',
    suggestedMaxFeePerGas: '53',
  },
  medium: {
    minWaitTimeEstimate: 30000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: '7',
    suggestedMaxFeePerGas: '70',
  },
  high: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: '10',
    suggestedMaxFeePerGas: '100',
  },
  estimatedBaseFee: '50',
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
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider transaction={{ txParams: { gas: '0x5208' } }}>
      <EditGasItem estimateType="low" {...props} />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasItem', () => {
  it('should renders low gas estimate options for estimateType low', () => {
    renderComponent({ estimateType: 'low' });

    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('6 min')).toBeInTheDocument();
    expect(screen.queryByTitle('0.001113 ETH')).toBeInTheDocument();
  });

  it('should renders market gas estimate options for estimateType medium', () => {
    renderComponent({ estimateType: 'medium' });

    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
    expect(screen.queryByText('30 sec')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00147 ETH')).toBeInTheDocument();
  });

  it('should renders aggressive gas estimate options for estimateType high', () => {
    renderComponent({ estimateType: 'high' });

    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('15 sec')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });
});
