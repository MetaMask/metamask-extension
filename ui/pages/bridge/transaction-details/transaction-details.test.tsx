import React from 'react';
import type { Location as RouterLocation } from 'react-router-dom';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockBridgeTxData from '../../../../test/data/bridge/mock-bridge-transaction-details.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import { TransactionGroup } from '../../../hooks/useTransactionDisplayData';
import CrossChainSwapTxDetails from './transaction-details';

const mockNavigate = jest.fn();
const mockLocation = jest.fn();
const mockParams = jest.fn();
const getTransactionWithoutNonce = (
  transaction: TransactionGroup['initialTransaction'],
) => ({
  ...transaction,
  txParams: {
    ...transaction.txParams,
    nonce: undefined,
  },
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
  useParams: () => mockParams(),
}));

const getMockStore = (
  transactionGroup: TransactionGroup,
  srcTxMetaId: string,
  txHistoryItem: BridgeHistoryItem,
) => {
  return configureStore(
    createBridgeMockStore({
      metamaskStateOverrides: {
        internalAccounts: {
          accounts: {
            id: {
              address: '0x30e8ccad5a980bdf30447f8c2c48e70989d9d294',
              scopes: [EthScope.Mainnet],
              type: EthAccountType.Eoa,
              metadata: {
                lastSelected: 0,
              },
            },
          },
          selectedAccount: 'id',
        },
        transactions: [
          transactionGroup.primaryTransaction,
          transactionGroup.initialTransaction,
        ],
        currencyRates: {},
        preferences: {},
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
        completedOnboarding: true,
        txHistory: {
          [srcTxMetaId]: {
            ...txHistoryItem,
            account: '0x30e8ccad5a980bdf30447f8c2c48e70989d9d294',
          },
        },
      },
    }),
  );
};

describe('transaction-details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.mockReturnValue({
      pathname: `/cross-chain/tx-details/${mockBridgeTxData.transactionGroup.initialTransaction.hash}`,
      search: '',
      hash: '',
      state: {
        transaction: {
          ...mockBridgeTxData.transactionGroup.initialTransaction,
          transactionCategory: 'BRIDGE_OUT',
        },
      },
      key: 'test-key',
    } as RouterLocation);
    mockParams.mockReturnValue({
      txHash: mockBridgeTxData.transactionGroup.primaryTransaction.hash,
    });
  });

  describe('bridge snapshots', () => {
    it('uses originalTransactionId lookup for intent transaction details', () => {
      mockLocation.mockReturnValue({
        pathname: '/cross-chain/tx-details/intent-tx-meta-id',
        search: '',
        hash: '',
        state: {
          transaction: {
            ...mockBridgeTxData.transactionGroup.initialTransaction,
            id: 'intent-tx-meta-id',
            hash: undefined,
            transactionCategory: 'BRIDGE_OUT',
          },
        },
        key: 'test-key',
      } as RouterLocation);
      mockParams.mockReturnValue({
        txHash: 'intent-tx-meta-id',
      });

      const { queryAllByTestId, getByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(mockBridgeTxData.transactionGroup, 'intent-order-uid', {
          ...mockBridgeTxData.bridgeHistoryItem,
          originalTransactionId: 'intent-tx-meta-id',
        } as never),
      );

      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(7);
      expect(
        getByText(messages.bridgeDetailsTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(messages.bridgeTxDetailsYouReceived.message),
      ).toBeInTheDocument();
      expect(getByText('1.981 USDC on')).toBeInTheDocument();
      expect(
        getByText(messages.bridgeTxDetailsStatus.message),
      ).toBeInTheDocument();
      expect(getByText('complete')).toBeInTheDocument();
    });

    it('should render completed bridge tx', () => {
      const { queryAllByTestId, getByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(
          mockBridgeTxData.transactionGroup,
          mockBridgeTxData.srcTxMetaId,
          mockBridgeTxData.bridgeHistoryItem as never,
        ),
      );
      const expectedRows = [
        'Statuscomplete',
        'BridgedPolygonOP',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'You received1.981 USDC onOP',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(7);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(
        getByText(messages.bridgeDetailsTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'PolygonScan',
          ),
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'Optimism Explorer',
          ),
        ),
      ).toBeInTheDocument();
    });

    it('should render pending bridge snapshot', () => {
      const { queryAllByTestId, getByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(
          {
            ...mockBridgeTxData.transactionGroup,
            initialTransaction: {
              ...mockBridgeTxData.transactionGroup.initialTransaction,
              status: TransactionStatus.approved,
            },
          },
          mockBridgeTxData.srcTxMetaId,
          {
            ...mockBridgeTxData.bridgeHistoryItem,
            status: {
              ...mockBridgeTxData.bridgeHistoryItem.status,
              status: StatusTypes.PENDING,
            },
          } as never,
        ),
      );
      const expectedRows = [
        'Statuspending',
        'BridgingPolygonOP',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(
        getByText(messages.bridgeDetailsTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'PolygonScan',
          ),
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'Optimism Explorer',
          ),
        ),
      ).toBeInTheDocument();
    });

    it('should render confirmed bridge tx', () => {
      const { queryAllByTestId, getByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(
          {
            ...mockBridgeTxData.transactionGroup,
            initialTransaction: {
              ...mockBridgeTxData.transactionGroup.initialTransaction,
              status: TransactionStatus.confirmed,
            },
          },
          mockBridgeTxData.srcTxMetaId,
          {
            ...mockBridgeTxData.bridgeHistoryItem,
            status: {
              ...mockBridgeTxData.bridgeHistoryItem.status,
              status: StatusTypes.PENDING,
            },
          } as never,
        ),
      );
      const expectedRows = [
        'Statuspending',
        'BridgingPolygonOP',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(
        getByText(messages.bridgeDetailsTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'PolygonScan',
          ),
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'Optimism Explorer',
          ),
        ),
      ).toBeInTheDocument();
    });

    it('should render bridge tx that failed on src', () => {
      const { queryAllByTestId, getByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(
          {
            ...mockBridgeTxData.transactionGroup,
            initialTransaction: {
              ...mockBridgeTxData.transactionGroup.initialTransaction,
              status: TransactionStatus.failed,
            },
          },
          mockBridgeTxData.srcTxMetaId,
          {
            ...mockBridgeTxData.bridgeHistoryItem,
            status: {
              ...mockBridgeTxData.bridgeHistoryItem.status,
              status: StatusTypes.PENDING,
            },
          } as never,
        ),
      );
      const expectedRows = [
        'Statuspending',
        'BridgingPolygonOP',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(
        getByText(messages.bridgeDetailsTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'PolygonScan',
          ),
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'Optimism Explorer',
          ),
        ),
      ).toBeInTheDocument();
    });

    it('should render bridge tx that failed on dest', () => {
      const { queryAllByTestId, getByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(
          {
            ...mockBridgeTxData.transactionGroup,
            initialTransaction: {
              ...mockBridgeTxData.transactionGroup.initialTransaction,
              status: TransactionStatus.confirmed,
            },
          },
          mockBridgeTxData.srcTxMetaId,
          {
            ...mockBridgeTxData.bridgeHistoryItem,
            status: {
              ...mockBridgeTxData.bridgeHistoryItem.status,
              status: StatusTypes.FAILED,
            },
          } as never,
        ),
      );

      const expectedRows = [
        'Statusfailed',
        'BridgingPolygonOP',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(
        getByText(messages.bridgeDetailsTitle.message),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'PolygonScan',
          ),
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          messages.bridgeExplorerLinkViewOn.message.replace(
            '$1',
            'Optimism Explorer',
          ),
        ),
      ).toBeInTheDocument();
    });

    it('should hide nonce row for intent swap details without nonce', () => {
      const nonceFreeTransaction = getTransactionWithoutNonce(
        mockBridgeTxData.transactionGroup.initialTransaction,
      );
      mockLocation.mockReturnValue({
        pathname: `/cross-chain/tx-details/${nonceFreeTransaction.hash}`,
        search: '',
        hash: '',
        state: {
          transaction: {
            ...nonceFreeTransaction,
            transactionCategory: 'BRIDGE_OUT',
          },
        },
        key: 'test-key',
      } as RouterLocation);
      mockParams.mockReturnValue({
        txHash: nonceFreeTransaction.hash,
      });

      const { queryAllByTestId, queryByText } = renderWithProvider(
        <CrossChainSwapTxDetails />,
        getMockStore(
          {
            ...mockBridgeTxData.transactionGroup,
            initialTransaction: {
              ...nonceFreeTransaction,
              status: TransactionStatus.approved,
            },
            primaryTransaction: {
              ...getTransactionWithoutNonce(
                mockBridgeTxData.transactionGroup.primaryTransaction,
              ),
              status: TransactionStatus.approved,
            },
          },
          mockBridgeTxData.srcTxMetaId,
          {
            ...mockBridgeTxData.bridgeHistoryItem,
            quote: {
              ...mockBridgeTxData.bridgeHistoryItem.quote,
              intent: {
                protocol: 'cowswap',
              },
            },
            status: {
              ...mockBridgeTxData.bridgeHistoryItem.status,
              status: StatusTypes.PENDING,
            },
          } as never,
        ),
      );

      const expectedRows = [
        'Statuspending',
        'BridgingPolygonOP',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(5);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });
      expect(
        queryByText(messages.bridgeTxDetailsNonce.message),
      ).not.toBeInTheDocument();
    });
  });
});
