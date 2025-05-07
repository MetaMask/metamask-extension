import React from 'react';
import { CaipChainId } from '@metamask/utils';
import {
  CaipAssetType,
  Transaction,
  TransactionStatus,
} from '@metamask/keyring-api';
import { screen, fireEvent } from '@testing-library/react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MOCK_ACCOUNT_SOLANA_MAINNET } from '../../../../test/data/mock-accounts';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  MultichainProviderConfig,
  SOLANA_BLOCK_EXPLORER_URL,
} from '../../../../shared/constants/multichain/networks';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MultichainTransactionDetailsModal } from './multichain-transaction-details-modal';
import {
  getAddressUrl,
  getTransactionUrl,
  shortenTransactionId,
} from './helpers';

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
        amount: '1.1',
        unit: 'BTC',
      },
    },
    {
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      asset: {
        fungible: true as const,
        type: 'native' as CaipAssetType,
        amount: '0.1',
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

const mockSwapTransaction = {
  type: 'swap' as const,
  status: TransactionStatus.Confirmed as TransactionStatus,
  timestamp: new Date('2023-09-30T12:56:00').getTime(),
  id: '5Y64J6gUNd67hM63Aeks3qVLGWRM3A52PFFjqKSPTVDdAZFbaPDHHLTFCs3ioeFcAAXFmqcUftZeLJVZCzqovAJ4',
  chain: MultichainNetworks.SOLANA as CaipChainId,
  account: 'test-account-id',
  events: [],
  from: [
    {
      address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
      asset: {
        fungible: true as const,
        type: 'native' as CaipAssetType,
        amount: '2.5',
        unit: 'SOL',
      },
    },
  ],
  to: [
    {
      address: MOCK_ACCOUNT_SOLANA_MAINNET.address,
      asset: {
        fungible: true as const,
        type: 'token' as CaipAssetType,
        amount: '100',
        unit: 'USDC',
      },
    },
  ],
  fees: [
    {
      type: 'base' as const,
      asset: {
        fungible: true as const,
        type: 'native' as CaipAssetType,
        amount: '0.000005',
        unit: 'SOL',
      },
    },
  ],
};

const mockProps = {
  transaction: mockTransaction,
  onClose: jest.fn(),
  userAddress: MOCK_ACCOUNT_SOLANA_MAINNET.address,
  networkConfig: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN],
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

  const renderComponent = (
    props: {
      transaction: Transaction;
      onClose: jest.Mock;
      userAddress: string;
      networkConfig: MultichainProviderConfig;
    } = mockProps,
  ) => {
    const store = configureStore(mockState.metamask);
    return renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <MultichainTransactionDetailsModal {...props} />
      </MetaMetricsContext.Provider>,
      store,
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
    const shortenedId = screen.getByText(shortenTransactionId(txId));
    expect(shortenedId).toBeInTheDocument();
  });

  it('displays network fee when present', () => {
    renderComponent();

    const feeElement =
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      screen.queryByTestId('transaction-network-fee') ||
      screen.queryByTestId('transaction-base-fee');

    expect(feeElement).not.toBeNull();
    expect(feeElement?.textContent).toContain('1.0001');
    expect(feeElement?.textContent).toContain('BTC');
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
  it.each([
    [TransactionStatus.Confirmed, 'Confirmed'],
    [TransactionStatus.Unconfirmed, 'Pending'],
    [TransactionStatus.Failed, 'Failed'],
    [TransactionStatus.Submitted, 'Submitted'],
  ])(
    'handles different transaction status: %s',
    (status: TransactionStatus, expectedLabel: string) => {
      const propsWithStatus = {
        ...mockProps,
        transaction: {
          ...mockTransaction,
          status,
        },
      };
      renderComponent(propsWithStatus);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    },
  );

  it('returns correct Bitcoin mainnet transaction URL', () => {
    const txId =
      '447755f24ab40f469309f357cfdd9e375e9569b2cf68aaeba2ebcc232eac9568';
    const chainId = MultichainNetworks.BITCOIN;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `https://mempool.space/tx/${txId}`,
    );
  });

  it('returns correct Bitcoin testnet transaction URL', () => {
    const txId =
      '447755f24ab40f469309f357cfdd9e375e9569b2cf68aaeba2ebcc232eac9568';
    const chainId = MultichainNetworks.BITCOIN_TESTNET;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `https://mempool.space/testnet/tx/${txId}`,
    );
  });

  it('returns correct Solana mainnet transaction URL', () => {
    const txId =
      '5Y64J6gUNd67hM63Aeks3qVLGWRM3A52PFFjqKSPTVDdAZFbaPDHHLTFCs3ioeFcAAXFmqcUftZeLJVZCzqovAJ4';
    const chainId = MultichainNetworks.SOLANA;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `${SOLANA_BLOCK_EXPLORER_URL}/tx/${txId}`,
    );
  });

  it('returns correct Solana devnet transaction URL', () => {
    const txId =
      '5Y64J6gUNd67hM63Aeks3qVLGWRM3A52PFFjqKSPTVDdAZFbaPDHHLTFCs3ioeFcAAXFmqcUftZeLJVZCzqovAJ4';
    const chainId = MultichainNetworks.SOLANA_DEVNET;

    expect(getTransactionUrl(txId, chainId)).toBe(
      `${SOLANA_BLOCK_EXPLORER_URL}/tx/${txId}?cluster=devnet`,
    );
  });

  it('returns correct Solana mainnet address URL', () => {
    const address = 'FKrZTPRmX6WpJL1YUCJmVH1AcmqLfjUt2rzovhLqLJQZ';
    const chainId = MultichainNetworks.SOLANA;

    expect(getAddressUrl(address, chainId)).toBe(
      `${SOLANA_BLOCK_EXPLORER_URL}/account/${address}`,
    );
  });

  it('returns correct Solana devnet address URL', () => {
    const address = 'FKrZTPRmX6WpJL1YUCJmVH1AcmqLfjUt2rzovhLqLJQZ';
    const chainId = MultichainNetworks.SOLANA_DEVNET;

    expect(getAddressUrl(address, chainId)).toBe(
      `${SOLANA_BLOCK_EXPLORER_URL}/account/${address}?cluster=devnet`,
    );
  });

  it('returns correct Bitcoin mainnet address URL', () => {
    const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
    const chainId = MultichainNetworks.BITCOIN;

    expect(getAddressUrl(address, chainId)).toBe(
      `https://mempool.space/address/${address}`,
    );
  });

  it('returns correct Bitcoin testnet address URL', () => {
    const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
    const chainId = MultichainNetworks.BITCOIN_TESTNET;

    expect(getAddressUrl(address, chainId)).toBe(
      `https://mempool.space/testnet/address/${address}`,
    );
  });

  it('renders Solana swap transaction details correctly', () => {
    const userAddress = MOCK_ACCOUNT_SOLANA_MAINNET.address;
    const swapProps = {
      transaction: mockSwapTransaction,
      onClose: jest.fn(),
      userAddress,
      networkConfig: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA],
    };

    renderComponent(swapProps);

    expect(screen.getByText('Swap')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-amount')).toHaveTextContent(
      '-2.5 SOL',
    );

    const addressStart = userAddress.substring(0, 6);
    const addressElements = screen.getAllByText((_content, element) => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return element?.textContent?.includes(addressStart) || false;
    });

    expect(addressElements.length).toBeGreaterThan(0);

    const feeElement =
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      screen.queryByTestId('transaction-network-fee') ||
      screen.queryByTestId('transaction-base-fee');

    expect(feeElement).not.toBeNull();
    expect(feeElement?.textContent).toContain('0.000005');
    expect(feeElement?.textContent).toContain('SOL');
  });
});
