import React from 'react';
import * as reactRouterDom from 'react-router-dom';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockBridgeTxData from '../../../../test/data/bridge/mock-bridge-transaction-details.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import configureStore from '../../../store/store';
import { TransactionGroup } from '../../../hooks/useTransactionDisplayData';
import CrossChainSwapTxDetails from './transaction-details';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
  useLocation: jest.fn(),
  useParams: jest.fn(),
}));

const getMockStore = (
  transactionGroup: TransactionGroup,
  srcTxMetaId: string,
  txHistoryItem: BridgeHistoryItem,
) => {
  jest.spyOn(reactRouterDom, 'useLocation').mockReturnValue({
    state: {
      transactionGroup,
    },
  });
  jest.spyOn(reactRouterDom, 'useParams').mockReturnValue({
    srcTxMetaId,
  });

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
        transactions: [transactionGroup.primaryTransaction],
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
  describe('bridge snapshots', () => {
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
        'BridgedPolygonOP Mainnet',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'You received1.981 USDC onOP Mainnet',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(7);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(getByText('Bridge details')).toBeInTheDocument();
      expect(getByText('View on PolygonScan')).toBeInTheDocument();
      expect(getByText('View on Optimism Explorer')).toBeInTheDocument();
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
        'BridgingPolygonOP Mainnet',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(getByText('Bridge details')).toBeInTheDocument();
      expect(getByText('View on PolygonScan')).toBeInTheDocument();
      expect(getByText('View on Optimism Explorer')).toBeInTheDocument();
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
        'BridgingPolygonOP Mainnet',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(getByText('Bridge details')).toBeInTheDocument();
      expect(getByText('View on PolygonScan')).toBeInTheDocument();
      expect(getByText('View on Optimism Explorer')).toBeInTheDocument();
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
        'BridgingPolygonOP Mainnet',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(getByText('Bridge details')).toBeInTheDocument();
      expect(getByText('View on PolygonScan')).toBeInTheDocument();
      expect(getByText('View on Optimism Explorer')).toBeInTheDocument();
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
        'BridgingPolygonOP Mainnet',
        'Time stamp',
        'You sent2 USDC onPolygon',
        'Total gas fee0.00446 POL',
        'Nonce3',
      ];
      expect(queryAllByTestId('transaction-detail-row')).toHaveLength(6);
      queryAllByTestId('transaction-detail-row').forEach((row, i) => {
        expect(row).toHaveTextContent(expectedRows[i]);
      });

      expect(getByText('Bridge details')).toBeInTheDocument();
      expect(getByText('View on PolygonScan')).toBeInTheDocument();
      expect(getByText('View on Optimism Explorer')).toBeInTheDocument();
    });
  });
});
