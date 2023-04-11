import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { TransactionStatus } from '../../../../shared/constants/transaction';
import { GAS_LIMITS } from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import TransactionListItemDetails from '.';

jest.mock('../../../store/actions.ts', () => ({
  tryReverseResolveAddress: () => jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn().mockResolvedValue(),
  addPollingTokenToAppState: jest.fn(),
}));

describe('TransactionListItemDetails Component', () => {
  const transaction = {
    history: [],
    id: 1,
    status: TransactionStatus.confirmed,
    txParams: {
      from: '0x1',
      gas: GAS_LIMITS.SIMPLE,
      gasPrice: '0x3b9aca00',
      nonce: '0xa4',
      to: '0x2',
      value: '0x2386f26fc10000',
    },
  };

  const transactionGroup = {
    transactions: [transaction],
    primaryTransaction: transaction,
    initialTransaction: transaction,
    nonce: '0xa4',
    hasRetried: false,
    hasCancelled: false,
  };

  const rpcPrefs = {
    blockExplorerUrl: 'https://customblockexplorer.com/',
  };

  const blockExplorerLinkText = {
    firstPart: 'addBlockExplorer',
    secondPart: '',
  };

  const props = {
    onClose: jest.fn(),
    title: 'Test Transaction Details',
    recipientAddress: '0xAddress',
    senderAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    tryReverseResolveAddress: jest.fn(),
    transactionGroup,
    transactionStatus: () => <div></div>,
    blockExplorerLinkText,
    rpcPrefs,
  };

  it('should render title with title prop', () => {
    const mockStore = configureMockStore([thunk])(mockState);

    const { queryByText } = renderWithProvider(
      <TransactionListItemDetails {...props} />,
      mockStore,
    );

    expect(queryByText(props.title)).toBeInTheDocument();
  });

  describe('Retry button', () => {
    it('should render retry button with showRetry prop', () => {
      const retryProps = {
        ...props,
        showRetry: true,
      };

      const mockStore = configureMockStore([thunk])(mockState);

      const { queryByTestId } = renderWithProvider(
        <TransactionListItemDetails {...retryProps} />,
        mockStore,
      );

      expect(queryByTestId('rety-button')).toBeInTheDocument();
    });
  });

  describe('Cancel button', () => {
    it('should render cancel button with showCancel prop', () => {
      const retryProps = {
        ...props,
        showCancel: true,
      };

      const mockStore = configureMockStore([thunk])(mockState);

      const { queryByTestId } = renderWithProvider(
        <TransactionListItemDetails {...retryProps} />,
        mockStore,
      );

      expect(queryByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  describe('Speedup button', () => {
    it('should render speedup button with showSpeedUp prop', () => {
      const retryProps = {
        ...props,
        showSpeedUp: true,
      };

      const mockStore = configureMockStore([thunk])(mockState);

      const { queryByTestId } = renderWithProvider(
        <TransactionListItemDetails {...retryProps} />,
        mockStore,
      );

      expect(queryByTestId('speedup-button')).toBeInTheDocument();
    });
  });
});
