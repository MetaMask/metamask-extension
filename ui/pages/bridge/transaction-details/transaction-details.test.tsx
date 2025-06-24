import React from 'react';
import * as reactRouterDom from 'react-router-dom';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { MINUTE } from '../../../../shared/constants/time';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockBridgeTxData from '../../../../test/data/bridge/mock-bridge-transaction-details.json';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import configureStore from '../../../store/store';
import { TransactionGroup } from '../../../hooks/useTransactionDisplayData';
import CrossChainSwapTxDetails, { getIsDelayed } from './transaction-details';

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
  describe('getIsDelayed', () => {
    it('returns false when status is not PENDING', () => {
      const result = getIsDelayed(StatusTypes.COMPLETE, {
        startTime: Date.now(),
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);
      expect(result).toBe(false);
    });

    it('returns false when bridgeHistoryItem is undefined', () => {
      const result = getIsDelayed(StatusTypes.PENDING, undefined);
      expect(result).toBe(false);
    });

    it('returns false when startTime is undefined', () => {
      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime: undefined,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);
      expect(result).toBe(false);
    });

    it('returns false when current time is less than estimated completion time', () => {
      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime: Date.now() - 1000,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);

      expect(result).toBe(false);
    });

    it('returns true when current time exceeds estimated completion time by 10 minutes', () => {
      const startTime = Date.now() - 61 * 1000 - 10 * MINUTE;

      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);

      expect(result).toBe(true);
    });

    it('returns false when current time exceeds estimated completion time, but less than 10 minutes have passed', () => {
      const startTime = Date.now() - 61 * 1000;

      const result = getIsDelayed(StatusTypes.PENDING, {
        startTime,
        estimatedProcessingTimeInSeconds: 60,
      } as BridgeHistoryItem);

      expect(result).toBe(false);
    });
  });

  describe('bridge snapshots', () => {
    it('should render completed bridge snapshot', () => {
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
        'BridgingPolygonOP Mainnet',
        'Time stampJun 20, 2025 at 05:43 PM',
        'You sent2 USDC onPolygon',
        'Total gas fee0.004455ETH',
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

    it('should render pending bridge snapshot', () => {
      const { baseElement } = renderWithProvider(
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
      expect(baseElement).toMatchSnapshot();
    });

    it('should render confirmed bridge snapshot', () => {
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
        'Time stampJun 20, 2025 at 05:43 PM',
        'You sent2 USDC onPolygon',
        'Total gas fee0.004455ETH',
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

    it('should render failed on src bridge snapshot', () => {
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
        'Time stampJun 20, 2025 at 05:43 PM',
        'You sent2 USDC onPolygon',
        'Total gas fee0.004455ETH',
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

    it('should render failed on dest bridge snapshot', () => {
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
        'Time stampJun 20, 2025 at 05:43 PM',
        'You sent2 USDC onPolygon',
        'Total gas fee0.004455ETH',
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
