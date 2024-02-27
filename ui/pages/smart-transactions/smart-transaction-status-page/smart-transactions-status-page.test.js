import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SmartTransactionStatusPage } from '.';

const middleware = [thunk];

describe('SmartTransactionStatusPage', () => {
  const requestState = {
    smartTransaction: {
      status: 'pending',
      creationTime: 1519211809934,
    },
  };

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Submitting your transaction')).toBeInTheDocument();
  });

  it('renders the "success" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'success';
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Transaction successful')).toBeInTheDocument();
  });

  it('renders the "reverted" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'reverted';
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Smart Transaction had an error')).toBeInTheDocument();
  });

  it('renders the "cancelled_user_cancelled" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    requestState.smartTransaction = latestSmartTransaction;
    latestSmartTransaction.status = 'cancelled_user_cancelled';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Smart Transaction was cancelled')).toBeInTheDocument();
  });

  it('renders the "deadline_missed" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'deadline_missed';
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Smart Transaction had an error')).toBeInTheDocument();
  });

  it('renders the "unknown" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'unknown';
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Smart Transaction had an error')).toBeInTheDocument();
  });
});
