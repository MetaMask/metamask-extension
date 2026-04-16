import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createSwapsMockStore } from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import SmartTransactionStatusLabel from '.';

const middleware = [thunk];
setBackgroundConnection({
  stopPollingForQuotes: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
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

describe('SmartTransactionStatusLabel', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(
      getByText(messages.stxPendingPubliclySubmittingSwap.message),
    ).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
  });

  it('renders the "success" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'success';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(getByText(messages.stxSuccess.message)).toBeInTheDocument();
    expect(
      getByText(messages.stxSuccessDescription.message.replace('$1', 'USDC')),
    ).toBeInTheDocument();
    expect(getByText(messages.makeAnotherSwap.message)).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
  });

  it('renders the "reverted" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'reverted';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(getByText(messages.stxFailure.message)).toBeInTheDocument();
    expect(getByText(messages.customerSupport.message)).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
  });

  it('renders the "cancelled_user_cancelled" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'cancelled_user_cancelled';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(getByText(messages.stxUserCancelled.message)).toBeInTheDocument();
    expect(
      getByText(messages.stxUserCancelledDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
  });

  it('renders the "deadline_missed" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'deadline_missed';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(getByText(messages.stxCancelled.message)).toBeInTheDocument();
    expect(
      getByText(messages.stxCancelledDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
  });

  it('renders the "unknown" STX status', () => {
    const mockStore = createSwapsMockStore();
    const latestSmartTransaction =
      mockStore.metamask.smartTransactionsState.smartTransactions[
        CHAIN_IDS.MAINNET
      ][1];
    latestSmartTransaction.status = 'unknown';
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(getByText(messages.stxUnknown.message)).toBeInTheDocument();
    expect(
      getByText(messages.stxUnknownDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.close.message)).toBeInTheDocument();
  });

  it('cancels a transaction', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(
      getByText(messages.stxPendingPubliclySubmittingSwap.message),
    ).toBeInTheDocument();
    const cancelLink = getByText(messages.attemptToCancelSwapForFree.message);
    expect(cancelLink).toBeInTheDocument();
    fireEvent.click(cancelLink);
    expect(getByText(messages.stxTryingToCancel.message)).toBeInTheDocument();
    expect(cancelLink).not.toBeInTheDocument();
  });

  it('clicks on the Close button', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(
      <SmartTransactionStatusLabel />,
      store,
    );
    expect(
      getByText(messages.stxPendingPubliclySubmittingSwap.message),
    ).toBeInTheDocument();
    const closeButton = getByText(messages.close.message);
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
  });
});
