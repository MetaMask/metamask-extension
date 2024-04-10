import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';

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
      status: SmartTransactionStatuses.PENDING,
      creationTime: Date.now(),
    },
  };

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Submitting your transaction')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "Sorry for the wait" pending status', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const newRequestState = {
      ...requestState,
      smartTransaction: {
        ...requestState.smartTransaction,
        creationTime: 1519211809934,
      },
    };
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={newRequestState} />,
      store,
    );
    expect(getByText('Sorry for the wait')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "success" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.SUCCESS;
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Your transaction is complete')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "reverted" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.REVERTED;
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Your transaction failed')).toBeInTheDocument();
    expect(
      getByText(
        'Sudden market changes can cause failures. If the problem continues, reach out to MetaMask customer support.',
      ),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "cancelled" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    requestState.smartTransaction = latestSmartTransaction;
    latestSmartTransaction.status = SmartTransactionStatuses.CANCELLED;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Your transaction was canceled')).toBeInTheDocument();
    expect(
      getByText(
        `Your transaction couldn't be completed, so it was canceled to save you from paying unnecessary gas fees.`,
      ),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "deadline_missed" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status =
      SmartTransactionStatuses.CANCELLED_DEADLINE_MISSED;
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Your transaction was canceled')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "unknown" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.UNKNOWN;
    requestState.smartTransaction = latestSmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage requestState={requestState} />,
      store,
    );
    expect(getByText('Your transaction failed')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
