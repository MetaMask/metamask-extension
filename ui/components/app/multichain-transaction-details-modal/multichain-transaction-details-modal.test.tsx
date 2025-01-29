import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { CaipAssetType, TransactionStatus } from '@metamask/keyring-api';
import { screen, fireEvent } from '@testing-library/react';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { MultichainTransactionDetailsModal } from './multichain-transaction-details-modal';
import { getTransactionUrl } from './helpers';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const mockTransaction = {
  type: 'send' as const,
  status: TransactionStatus.Confirmed as TransactionStatus,
  timestamp: new Date('2023-09-30T12:56:00').getTime(),
  id: 'b93ea2cb4eed0f9e13284ed8860bcfc45de2488bb6a8b0b2a843c4b2fbce40f3',
  chain: 'bip122:000000000019d6689c085ae165831e93' as CaipChainId,
  account: 'test-account-id',
  events: [],
  from: [
    {
      address: 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',
      asset: {
        fungible: true as const,
        type: 'native' as CaipAssetType,
        amount: '1.2',
        unit: 'BTC',
      },
    },
  ],
  to: [
    {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      asset: {
        fungible: true as const,
        type: 'native' as CaipAssetType,
        amount: '1.2',
        unit: 'BTC',
      },
    },
  ],
  fees: [
    {
      type: 'base' as const,
      asset: {
        fungible: true as const,
        type: 'native' as CaipAssetType,
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
    chainId: 'bip122:000000000019d6689c085ae165831e93' as CaipChainId,
    network: {
      type: 'bitcoin',
      chainId: 'bip122:000000000019d6689c085ae165831e93' as CaipChainId,
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

    expect(screen.getByText('Send')).toBeInTheDocument();
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
    const shortenedTxId = screen.getByText(shortenAddress(txId));
    expect(shortenedTxId).toBeInTheDocument();
  });

  it('displays network fee when present', () => {
    renderComponent();
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

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(['confirmed', 'pending', 'failed'] as const)(
    'handles different transaction status: %s',
    (status: string) => {
      const propsWithStatus = {
        ...mockProps,
        transaction: {
          ...mockTransaction,
          status: status as TransactionStatus,
        },
      };
      renderComponent(propsWithStatus);
      expect(
        screen.getByText(status.charAt(0).toUpperCase() + status.slice(1)),
      ).toBeInTheDocument();
    },
  );

  it('returns correct Bitcoin mainnet transaction URL', () => {
    const txId =
      '447755f24ab40f469309f357cfdd9e375e9569b2cf68aaeba2ebcc232eac9568';
    const chainId = MultichainNetworks.BITCOIN;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `https://blockstream.info/tx/${txId}`,
    );
  });

  it('returns correct Bitcoin testnet transaction URL', () => {
    const txId =
      '447755f24ab40f469309f357cfdd9e375e9569b2cf68aaeba2ebcc232eac9568';
    const chainId = MultichainNetworks.BITCOIN_TESTNET;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `https://blockstream.info/testnet/tx/${txId}`,
    );
  });

  it('returns correct Solana mainnet transaction URL', () => {
    const txId =
      '5Y64J6gUNd67hM63Aeks3qVLGWRM3A52PFFjqKSPTVDdAZFbaPDHHLTFCs3ioeFcAAXFmqcUftZeLJVZCzqovAJ4';
    const chainId = MultichainNetworks.SOLANA;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `https://explorer.solana.com/tx/${txId}`,
    );
  });

  it('returns correct Solana devnet transaction URL', () => {
    const txId =
      '5Y64J6gUNd67hM63Aeks3qVLGWRM3A52PFFjqKSPTVDdAZFbaPDHHLTFCs3ioeFcAAXFmqcUftZeLJVZCzqovAJ4';
    const chainId = MultichainNetworks.SOLANA_DEVNET;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `https://explorer.solana.com/tx/${txId}?cluster=devnet`,
    );
  });
});
