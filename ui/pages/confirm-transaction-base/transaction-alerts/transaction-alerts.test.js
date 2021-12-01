import React from 'react';
import { screen } from '@testing-library/react';

import { ETH } from '../../../helpers/constants/common';
import { TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import configureStore from '../../../store/store';

import TransactionAlerts from './transaction-alerts';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const render = ({ props, state }) => {
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
          balance: '0x1F4',
        },
      },
      selectedAddress: '0xAddress',
      ...state,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider {...props}>
      <TransactionAlerts />
    </GasFeeContextProvider>,
    store,
  );
};

describe('TransactionAlerts', () => {
  it('should returning warning message for low gas estimate', () => {
    render({ props: { transaction: { userFeeLevel: 'low' } } });
    expect(
      document.getElementsByClassName('actionable-message--warning'),
    ).toHaveLength(1);
  });

  it('should return null for gas estimate other than low', () => {
    render({ props: { transaction: { userFeeLevel: 'high' } } });
    expect(
      document.getElementsByClassName('actionable-message--warning'),
    ).toHaveLength(0);
  });

  it('should not show insufficient balance message if transaction value is less than balance', () => {
    render({
      props: {
        transaction: { userFeeLevel: 'high', txParams: { value: '0x64' } },
      },
    });
    expect(screen.queryByText('Insufficient funds.')).not.toBeInTheDocument();
  });

  it('should show insufficient balance message if transaction value is more than balance', () => {
    render({
      props: {
        transaction: { userFeeLevel: 'high', txParams: { value: '0x5208' } },
      },
    });
    expect(screen.queryByText('Insufficient funds.')).toBeInTheDocument();
  });

  it('should show pending transaction message if there are >= 1 pending transactions', () => {
    render({
      state: {
        currentNetworkTxList: [
          {
            id: 0,
            time: 0,
            txParams: {
              from: '0xAddress',
              to: '0xRecipient',
            },
            status: TRANSACTION_STATUSES.SUBMITTED,
          },
        ],
      },
    });
    expect(
      screen.queryByText('You have (1) pending transaction(s).'),
    ).toBeInTheDocument();
  });
});
