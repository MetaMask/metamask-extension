import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MultichainTransactionDetailsModal } from './multichain-transaction-details-modal';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const mockTransaction = {
  type: 'Send BTC',
  status: 'confirmed',
  timestamp: new Date('2023-09-30T12:56:00').getTime(),
  id: 'b93ea2cb4eed0f9e13284ed8860bcfc45de2488bb6a8b0b2a843c4b2fbce40f3',
  from: [
    {
      address: 'bc1p7atgm33ak04ntsq9366mvym42ecrk4y34ssysc99340a39eq9arq0pu9uj',
      asset: {
        fungible: true,
        type: 'native',
        amount: '1.2',
        unit: 'BTC',
      },
    },
  ],
  to: [
    {
      address: 'bc1p3t7744qewy262ym5afgeuqlwswtpfe22y7c4lwv0a7972p2k73msee7rr3',
      asset: {
        fungible: true,
        type: 'native',
        amount: '1.2',
        unit: 'BTC',
      },
    },
  ],
  fees: [
    {
      type: 'base',
      asset: {
        fungible: true,
        type: 'native',
        amount: '1.0001',
        unit: 'BTC',
      },
    },
  ],
};

const mockProps = {
  transaction: mockTransaction,
  onClose: jest.fn(),
  addressLink: 'https://explorer.bitcoin.com/btc/tx/3302...90c1',
  multichainNetwork: {
    nickname: 'Bitcoin',
    isEvmNetwork: false,
    chainId: 'bip122:000000000019d6689c085ae165831e93' as `${string}:${string}`,
    network: {
      type: 'bitcoin',
      chainId:
        'bip122:000000000019d6689c085ae165831e93' as `${string}:${string}`,
      ticker: 'BTC',
      nickname: 'Bitcoin',
      isAddressCompatible: (_address: string) => true,
      rpcPrefs: {
        blockExplorerUrl: 'https://explorer.bitcoin.com',
      },
    },
  },
};

describe('MultichainTransactionDetailsModal', () => {
  const mockTrackEvent = jest.fn();
  const useI18nContextMock = useI18nContext as jest.Mock;

  beforeEach(() => {
    useI18nContextMock.mockReturnValue((key: string) => key);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = mockProps) => {
    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <MultichainTransactionDetailsModal {...props} />
      </MetaMetricsContext.Provider>,
    );
  };

  it('renders the modal with transaction details', () => {
    renderComponent();

    expect(screen.getByText('Send btc')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-amount')).toHaveTextContent(
      '1.2 BTC',
    );
  });

  it('displays the correct transaction status with appropriate color', () => {
    renderComponent();
    const statusElement = screen.getByText('Confirmed');
    expect(statusElement).toHaveClass('mm-box--color-success-default');
  });

  it('shows transaction ID in shortened format', () => {
    renderComponent();
    const txId = mockTransaction.id;
    const shortenedTxId = screen.getByText(
      `${txId.substring(0, 7)}...${txId.substring(txId.length - 5)}`,
    );
    expect(shortenedTxId).toBeInTheDocument();
  });

  it('displays network fee when present', () => {
    renderComponent();
    expect(screen.getByText('networkFee')).toBeInTheDocument();
    expect(screen.getByText('1.0001 BTC')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderComponent();
    const closeButton = screen.getByRole('button', { name: /close/iu });
    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('renders the view details button with correct link', () => {
    renderComponent();
    const viewDetailsButton = screen.getByText('viewDetails');
    expect(viewDetailsButton).toBeInTheDocument();
    fireEvent.click(viewDetailsButton);
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('handles different transaction statuses', () => {
    const statuses = ['confirmed', 'pending', 'failed'];
    statuses.forEach((status) => {
      const propsWithStatus = {
        ...mockProps,
        transaction: {
          ...mockTransaction,
          status,
        },
      };
      const { rerender } = renderComponent(propsWithStatus);
      expect(
        screen.getByText(status.charAt(0).toUpperCase() + status.slice(1)),
      ).toBeInTheDocument();
      rerender(<div />);
    });
  });
});
