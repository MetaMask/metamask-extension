import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
  fireEvent,
} from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import SmartTransactionStatus from '.';

const middleware = [thunk];
setBackgroundConnection({
  stopPollingForQuotes: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
});

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

jest.mock('../../../ducks/swaps/swaps', () => {
  const original = jest.requireActual('../../../ducks/swaps/swaps');
  return {
    ...original,
    prepareToLeaveSwaps: jest.fn(() => {
      return {
        type: 'MOCK_TYPE',
      };
    }),
  };
});

describe('SmartTransactionStatus', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Publicly submitting your Swap...')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('renders the "success" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'success';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Swap complete!')).toBeInTheDocument();
    expect(getByText('Your USDC is now available.')).toBeInTheDocument();
    expect(getByText('Create a new swap')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('renders the "reverted" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'reverted';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Swap failed')).toBeInTheDocument();
    expect(getByText('customer support')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('renders the "cancelled_user_cancelled" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'cancelled_user_cancelled';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Swap cancelled')).toBeInTheDocument();
    expect(
      getByText(
        'Your transaction has been cancelled and you did not pay any unnecessary gas fees.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('renders the "deadline_missed" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'deadline_missed';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Swap would have failed')).toBeInTheDocument();
    expect(
      getByText(
        'Your transaction would have failed and was cancelled to protect you from paying unnecessary gas fees.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('renders the "unknown" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'unknown';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Status unknown')).toBeInTheDocument();
    expect(
      getByText(
        'A transaction has been successful but we’re unsure what it is. This may be due to submitting another transaction while this swap was processing.',
      ),
    ).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });

  it('cancels a transaction', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Publicly submitting your Swap...')).toBeInTheDocument();
    const cancelLink = getByText('Cancel swap for ~0');
    expect(cancelLink).toBeInTheDocument();
    fireEvent.click(cancelLink);
    expect(
      getByText('Trying to cancel your transaction...'),
    ).toBeInTheDocument();
    expect(cancelLink).not.toBeInTheDocument();
  });

  it('clicks on the Close button', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Publicly submitting your Swap...')).toBeInTheDocument();
    const closeButton = getByText('Close');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
  });
});
