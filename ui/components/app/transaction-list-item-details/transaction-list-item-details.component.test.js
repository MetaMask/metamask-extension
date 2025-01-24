import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { GAS_LIMITS } from '../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import TransactionListItemDetails from '.';

jest.mock('../../../store/actions.ts', () => ({
  tryReverseResolveAddress: () => jest.fn(),
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
}));

let mockGetCustodianTransactionDeepLink = jest.fn();

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianTransactionDeepLink: () => mockGetCustodianTransactionDeepLink,
  }),
}));

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
  metadata: {
    note: 'some note',
  },
  custodyId: '1',
};

const transactionGroup = {
  transactions: [transaction],
  primaryTransaction: transaction,
  initialTransaction: transaction,
  nonce: '0xa4',
  hasRetried: false,
  hasCancelled: false,
};

const render = (overrideProps) => {
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
    transactionStatus: () => <div />,
    blockExplorerLinkText,
    rpcPrefs,
    ...overrideProps,
  };

  const mockStore = configureMockStore([thunk])(mockState);

  const result = renderWithProvider(
    <TransactionListItemDetails {...props} />,
    mockStore,
  );

  return result;
};

describe('TransactionListItemDetails Component', () => {
  describe('matches snapshot', () => {
    it('for non-error details', async () => {
      const { queryByText, queryByTestId } = render();
      expect(queryByText('Test Transaction Details')).toBeInTheDocument();
      expect(
        queryByTestId('transaction-list-item-details-banner-error-message'),
      ).not.toBeInTheDocument();
    });

    it('for error details', async () => {
      const { queryByText, queryByTestId } = render({ showErrorBanner: true });
      expect(queryByText('Test Transaction Details')).toBeInTheDocument();
      expect(
        queryByTestId('transaction-list-item-details-banner-error-message'),
      ).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('renders retry button with showRetry prop', async () => {
      const { queryByTestId } = render({ showRetry: true });
      expect(queryByTestId('rety-button')).toBeInTheDocument();
    });

    it('renders cancel button with showCancel prop', async () => {
      const { queryByTestId } = render({ showCancel: true });
      expect(queryByTestId('cancel-button')).toBeInTheDocument();
    });

    it('renders speedup button with showSpeedUp prop', async () => {
      const { queryByTestId } = render({ showSpeedUp: true });
      expect(queryByTestId('speedup-button')).toBeInTheDocument();
    });
  });

  describe('Institutional', () => {
    it('renders correctly if custodyTransactionDeepLink has a url', async () => {
      mockGetCustodianTransactionDeepLink = jest
        .fn()
        .mockReturnValue({ url: 'https://url.com' });

      render({ showCancel: true });

      await waitFor(() => {
        const custodianViewButton = document.querySelector(
          '[data-original-title="View in custodian app"]',
        );

        // Assert that the custodian view button is rendered
        expect(custodianViewButton).toBeInTheDocument();
      });
    });

    it('renders correctly if transactionNote is provided', async () => {
      const newTransaction = {
        ...transaction,
        metadata: {
          note: 'some note',
        },
        custodyId: '1',
      };

      const newTransactionGroup = {
        ...transactionGroup,
        transactions: [newTransaction],
        primaryTransaction: newTransaction,
        initialTransaction: newTransaction,
      };

      const { queryByText } = render({
        transactionGroup: newTransactionGroup,
      });

      expect(queryByText('some note')).toBeInTheDocument();
    });
  });
});
