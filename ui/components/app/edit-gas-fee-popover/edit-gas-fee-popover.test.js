import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ETH } from '../../../helpers/constants/common';
import configureStore from '../../../store/store';
import { GasFeeContextProvider } from '../../../contexts/gasFee';

import EditGasFeePopover from './edit-gas-fee-popover';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    currentModal: 'editGasFee',
  }),
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

const render = (txProps) => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
      provider: {},
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x1F4',
        },
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates: MOCK_FEE_ESTIMATE,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{ txParams: { gas: '0x5208' }, ...txProps }}
    >
      <EditGasFeePopover />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasFeePopover', () => {
  it('should renders low / medium / high options', () => {
    render({ dappSuggestedGasFees: {} });

    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('⚙')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
    expect(screen.queryByText('Site')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
  });

  it('should show time estimates', () => {
    render();
    expect(screen.queryAllByText('5 min')).toHaveLength(2);
    expect(screen.queryByText('15 sec')).toBeInTheDocument();
  });

  it('should show gas fee estimates', () => {
    render();
    expect(screen.queryByTitle('0.001113 ETH')).toBeInTheDocument();
    expect(screen.queryByTitle('0.00147 ETH')).toBeInTheDocument();
    expect(screen.queryByTitle('0.0021 ETH')).toBeInTheDocument();
  });

  it('should not show insufficient balance message if transaction value is less than balance', () => {
    render({ userFeeLevel: 'high', txParams: { value: '0x64' } });
    expect(screen.queryByText('Insufficient funds.')).not.toBeInTheDocument();
  });

  it('should show insufficient balance message if transaction value is more than balance', () => {
    render({ userFeeLevel: 'high', txParams: { value: '0x5208' } });
    expect(screen.queryByText('Insufficient funds.')).toBeInTheDocument();
  });
});
