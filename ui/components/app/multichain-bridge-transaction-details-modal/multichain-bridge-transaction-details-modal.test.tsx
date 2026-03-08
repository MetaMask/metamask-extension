import React from 'react';
import { render, screen } from '@testing-library/react';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { type Transaction, TransactionStatus } from '@metamask/keyring-api';
import { StatusTypes } from '@metamask/bridge-controller';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import useBridgeChainInfo from '../../../hooks/bridge/useBridgeChainInfo';
import MultichainBridgeTransactionDetailsModal from './multichain-bridge-transaction-details-modal';

jest.mock('../../../hooks/bridge/useBridgeChainInfo');

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const messages: Record<string, string> = {
      bridgeDetailsTitle: 'Bridge details',
      bridgeStatusComplete: 'Complete',
      bridgeStatusFailed: 'Failed',
      bridgeStatusInProgress: 'In progress',
      bridgeTxDetailsBridged: 'Bridged',
      bridgeTxDetailsBridging: 'Bridging',
      bridgeTxDetailsSwapped: 'Swapped',
      bridgeTxDetailsSwapping: 'Swapping',
      destinationTransactionIdLabel: 'Destination transaction ID',
      from: 'From',
      status: 'Status',
      swapDetailsTitle: 'Swap details',
      to: 'To',
      transactionIdLabel: 'Transaction ID',
      transactionTotalGasFee: 'Total gas fee',
      viewOnBlockExplorer: 'View on block explorer',
      youReceived: 'You received',
      youSent: 'You sent',
    };

    return messages[key] ?? key;
  },
}));

jest.mock('../multichain-transaction-details-modal/helpers', () => ({
  formatTimestamp: () => 'Feb 24, 2024',
  getTransactionUrl: () => 'https://example.com/source',
  shortenTransactionId: (value: string) => value,
}));

const mockUseBridgeChainInfo = useBridgeChainInfo as jest.Mock;

describe('MultichainBridgeTransactionDetailsModal', () => {
  beforeEach(() => {
    mockUseBridgeChainInfo.mockReturnValue({
      srcNetwork: {
        chainId: 'tron:728126428',
        isEvm: false,
      },
      destNetwork: {
        chainId: 'tron:728126428',
        isEvm: false,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders same-chain Tron async swaps with swap-specific copy', () => {
    const transaction = {
      id: 'tron-swap-source',
      chain: 'tron:728126428',
      status: TransactionStatus.Confirmed,
      timestamp: 1708800000,
      from: [
        {
          asset: {
            amount: '5',
            fungible: true,
            type: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            unit: 'USDT',
          },
        },
      ],
      fees: [
        {
          type: 'base',
          asset: {
            amount: '1',
            fungible: true,
            type: 'tron:728126428/slip44:195',
            unit: 'TRX',
          },
        },
      ],
    } as unknown as Transaction;

    const bridgeHistoryItem = {
      quote: {
        srcChainId: 'tron:728126428',
        destChainId: 'tron:728126428',
        srcAsset: {
          symbol: 'USDT',
          name: 'Tether USD',
          iconUrl: 'https://example.com/usdt.png',
          decimals: 6,
        },
        destAsset: {
          symbol: 'TRX',
          name: 'Tron',
          iconUrl: 'https://example.com/trx.png',
          decimals: 6,
        },
        srcTokenAmount: '5000000',
        destTokenAmount: '4200000',
      },
      status: {
        srcChain: {
          txHash: '0xsource',
        },
        destChain: {
          txHash: '0xdestination',
          chainId: 'tron:728126428',
        },
        status: StatusTypes.PENDING,
      },
    } as unknown as BridgeHistoryItem;

    render(
      <MetaMetricsContext.Provider
        value={
          {
            trackEvent: jest.fn(),
          } as never
        }
      >
        <MultichainBridgeTransactionDetailsModal
          transaction={transaction}
          bridgeHistoryItem={bridgeHistoryItem}
          onClose={jest.fn()}
        />
      </MetaMetricsContext.Provider>,
    );

    expect(screen.getByText('Swap details')).toBeInTheDocument();
    expect(screen.queryByText('Bridge details')).not.toBeInTheDocument();
    expect(screen.getByText('Swapping')).toBeInTheDocument();
    expect(screen.getByText('USDT')).toBeInTheDocument();
    expect(screen.getByText('TRX')).toBeInTheDocument();
  });
});
