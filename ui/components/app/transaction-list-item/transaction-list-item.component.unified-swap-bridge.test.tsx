import { TransactionStatus } from '@metamask/transaction-controller';
import { fireEvent } from '@testing-library/react';
import { StatusTypes } from '@metamask/bridge-controller';
import React from 'react';
import * as reactRouterDom from 'react-router-dom';
import configureStore from 'redux-mock-store';
import mockUnifiedSwapTxGroup from '../../../../test/data/swap/mock-unified-swap-transaction-group.json';
import mockBridgeTxData from '../../../../test/data/bridge/mock-bridge-transaction-details.json';
import { renderWithProvider } from '../../../../test/jest';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import TransactionListItem from '.';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('../../../store/background-connection', () => ({
  ...jest.requireActual('../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

describe('TransactionListItem for Unified Swap and Bridge', () => {
  it('should render confirmed unified swap tx summary', () => {
    const { queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={jest.fn()}>
        <TransactionListItem transactionGroup={mockUnifiedSwapTxGroup} />
      </MetaMetricsContext.Provider>,
      configureStore()(createBridgeMockStore()),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap to Confirmed-0 ETH',
    );
  });

  it('should render failed unified swap tx summary', () => {
    const { queryByTestId, getByText } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockUnifiedSwapTxGroup,
          primaryTransaction: {
            ...mockUnifiedSwapTxGroup.primaryTransaction,
            status: TransactionStatus.failed,
          },
        }}
      />,
      configureStore()(
        createBridgeMockStore({
          bridgeStatusStateOverrides: {
            txHistory: {
              [mockUnifiedSwapTxGroup.primaryTransaction.id]: {
                ...mockBridgeTxData.bridgeHistoryItem,
              },
            },
          },
        }),
      ),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap USDC to USDCFailed-2 USDC-USD 0.00',
    );
    expect(getByText('Failed')).toBeInTheDocument();
  });

  it('should render pending confirmed bridge tx summary', () => {
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    const { queryByTestId } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockBridgeTxData.transactionGroup,
          primaryTransaction: {
            ...mockBridgeTxData.transactionGroup.primaryTransaction,
            status: TransactionStatus.confirmed,
          },
        }}
      />,
      configureStore()(
        createBridgeMockStore({
          bridgeStatusStateOverrides: {
            txHistory: {
              [srcTxMetaId]: {
                ...bridgeHistoryItem,
                status: {
                  ...bridgeHistoryItem.status,
                  status: StatusTypes.PENDING,
                },
              },
            },
          },
        }),
      ),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetTransaction 2 of 2-2 USDC',
    );
  });

  it('should render submitted bridge tx summary', () => {
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    const { queryByTestId } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockBridgeTxData.transactionGroup,
          primaryTransaction: {
            ...mockBridgeTxData.transactionGroup.primaryTransaction,
            status: TransactionStatus.submitted,
          },
        }}
      />,
      configureStore()(
        createBridgeMockStore({
          bridgeStatusStateOverrides: {
            txHistory: {
              [srcTxMetaId]: {
                ...bridgeHistoryItem,
                status: {
                  ...bridgeHistoryItem.status,
                  destChain: {},
                  status: StatusTypes.PENDING,
                },
              },
            },
          },
        }),
      ),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetTransaction 2 of 2-2 USDC-USD 0.00',
    );
  });

  it('should render completed bridge tx summary', () => {
    const mockPush = jest
      .fn()
      .mockImplementation((...args) => jest.fn(...args));
    jest.spyOn(reactRouterDom, 'useHistory').mockReturnValue({
      push: mockPush,
    });
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    const { queryByTestId, getByTestId } = renderWithProvider(
      <TransactionListItem
        transactionGroup={mockBridgeTxData.transactionGroup}
      />,
      configureStore()(
        createBridgeMockStore({
          bridgeStatusStateOverrides: {
            txHistory: {
              [srcTxMetaId]: bridgeHistoryItem,
            },
          },
        }),
      ),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetConfirmed-2 USDC',
    );

    fireEvent.click(getByTestId('activity-list-item'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/cross-chain/tx-details/ba5f53b0-4e38-11f0-88dc-53f7e315d450',
      state: {
        transactionGroup: mockBridgeTxData.transactionGroup,
        isEarliestNonce: false,
      },
    });
  });

  it('should render failed bridge tx summary', () => {
    const mockPush = jest
      .fn()
      .mockImplementation((...args) => jest.fn(...args));
    jest.spyOn(reactRouterDom, 'useHistory').mockReturnValue({
      push: mockPush,
    });
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    const failedTransactionGroup = {
      ...mockBridgeTxData.transactionGroup,
      primaryTransaction: {
        ...mockBridgeTxData.transactionGroup.primaryTransaction,
        status: TransactionStatus.failed,
      },
    };
    const { queryByTestId, getByTestId, getByText } = renderWithProvider(
      <TransactionListItem transactionGroup={failedTransactionGroup} />,
      configureStore()(
        createBridgeMockStore({
          bridgeStatusStateOverrides: {
            txHistory: {
              [srcTxMetaId]: bridgeHistoryItem,
            },
          },
        }),
      ),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetFailed-2 USDC',
    );
    expect(getByText('Failed')).toBeInTheDocument();

    fireEvent.click(getByTestId('activity-list-item'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/cross-chain/tx-details/ba5f53b0-4e38-11f0-88dc-53f7e315d450',
      state: {
        transactionGroup: failedTransactionGroup,
        isEarliestNonce: false,
      },
    });
  });
});
