import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { TransactionStatus } from '@metamask/transaction-controller';
import { act, waitFor } from '@testing-library/react';
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
};

const transactionGroup = {
  transactions: [transaction],
  primaryTransaction: transaction,
  initialTransaction: transaction,
  nonce: '0xa4',
  hasRetried: false,
  hasCancelled: false,
};

const render = async (overrideProps) => {
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
    recipientAddress: '0x0000000000000000000000000000000000000000',
    senderAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    tryReverseResolveAddress: jest.fn(),
    transactionGroup,
    transactionStatus: () => <div></div>,
    blockExplorerLinkText,
    rpcPrefs,
    ...overrideProps,
  };

  const mockStore = configureMockStore([thunk])(mockState);

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <TransactionListItemDetails {...props} />,
        mockStore,
      )),
  );

  return result;
};

describe('TransactionListItemDetails Component', () => {
  it('should render title with title prop', async () => {
    const { queryByText } = await render();

    await waitFor(() => {
      expect(queryByText('Test Transaction Details')).toBeInTheDocument();
    });
  });

  /**
   * Disabling the retry button until further notice
   *
   * @see {@link https://github.com/MetaMask/metamask-extension/issues/28615}
   */
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('Retry button', () => {
    it('should render retry button with showRetry prop', async () => {
      const { queryByTestId } = await render({ showRetry: true });

      expect(queryByTestId('rety-button')).toBeInTheDocument();
    });
  });

  describe('Cancel button', () => {
    it('should render cancel button with showCancel prop', async () => {
      const { queryByTestId } = await render({ showCancel: true });

      expect(queryByTestId('cancel-button')).toBeInTheDocument();
    });
  });

  describe('Speedup button', () => {
    it('should render speedup button with showSpeedUp prop', async () => {
      const { queryByTestId } = await render({ showSpeedUp: true });

      expect(queryByTestId('speedup-button')).toBeInTheDocument();
    });
  });
});
