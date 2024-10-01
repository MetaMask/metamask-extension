import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  SmartTransaction,
  SmartTransactionStatuses,
} from '@metamask/smart-transactions-controller/dist/types';

import { fireEvent } from '@testing-library/react';
import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  SmartTransactionStatusPage,
  RequestState,
} from './smart-transaction-status-page';

const middleware = [thunk];

describe('SmartTransactionStatusPage', () => {
  const onCloseExtension = jest.fn();
  const onViewActivity = jest.fn();

  const requestState: RequestState = {
    smartTransaction: {
      status: SmartTransactionStatuses.PENDING,
      creationTime: Date.now(),
      uuid: 'uuid',
      chainId: CHAIN_IDS.MAINNET,
    },
    isDapp: false,
    txId: 'txId',
  };

  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(getByText('Your transaction was submitted')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "success" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.SUCCESS;
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(getByText('Your transaction is complete')).toBeInTheDocument();
    expect(getByText('View transaction')).toBeInTheDocument();
    expect(getByText('View activity')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "reverted" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.REVERTED;
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(getByText('Your transaction failed')).toBeInTheDocument();
    expect(getByText('View transaction')).toBeInTheDocument();
    expect(getByText('View activity')).toBeInTheDocument();
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
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    latestSmartTransaction.status = SmartTransactionStatuses.CANCELLED;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(getByText('Your transaction was canceled')).toBeInTheDocument();
    expect(
      getByText(
        `Your transaction couldn't be completed, so it was canceled to save you from paying unnecessary gas fees.`,
      ),
    ).toBeInTheDocument();
    expect(getByText('View transaction')).toBeInTheDocument();
    expect(getByText('View activity')).toBeInTheDocument();
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
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(getByText('Your transaction was canceled')).toBeInTheDocument();
    expect(getByText('View transaction')).toBeInTheDocument();
    expect(getByText('View activity')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "unknown" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.UNKNOWN;
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(getByText('Your transaction failed')).toBeInTheDocument();
    expect(getByText('View transaction')).toBeInTheDocument();
    expect(getByText('View activity')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "pending" STX status for a dapp transaction', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.PENDING;
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    requestState.isDapp = true;
    const store = configureMockStore(middleware)(mockStore);
    const { queryByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(
      queryByText('You may close this window anytime.'),
    ).toBeInTheDocument();
    expect(queryByText('View transaction')).toBeInTheDocument();
    expect(queryByText('Close extension')).toBeInTheDocument();
    expect(queryByText('View activity')).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "success" STX status for a dapp transaction', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.SUCCESS;
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    requestState.isDapp = true;
    const store = configureMockStore(middleware)(mockStore);
    const { queryByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(
      queryByText('You may close this window anytime.'),
    ).not.toBeInTheDocument();
    expect(queryByText('View transaction')).toBeInTheDocument();
    expect(queryByText('Close extension')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the "cancelled" STX status for a dapp transaction', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = SmartTransactionStatuses.CANCELLED;
    requestState.smartTransaction = latestSmartTransaction as SmartTransaction;
    requestState.isDapp = true;
    const store = configureMockStore(middleware)(mockStore);
    const { queryByText, container } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={requestState}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );
    expect(
      queryByText('You may close this window anytime.'),
    ).not.toBeInTheDocument();
    expect(queryByText('View transaction')).toBeInTheDocument();
    expect(queryByText('Close extension')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('calls onCloseExtension when Close extension button is clicked', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={{ ...requestState, isDapp: true }}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );

    const closeButton = getByText('Close extension');
    fireEvent.click(closeButton);
    expect(onCloseExtension).toHaveBeenCalled();
  });

  it('calls onViewActivity when View activity button is clicked', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusPage
        requestState={{ ...requestState, isDapp: false }}
        {...{ onCloseExtension, onViewActivity }}
      />,
      store,
    );

    const viewActivityButton = getByText('View activity');
    fireEvent.click(viewActivityButton);
    expect(onViewActivity).toHaveBeenCalled();
  });
});
