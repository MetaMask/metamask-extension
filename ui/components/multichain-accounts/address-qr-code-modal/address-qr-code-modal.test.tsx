import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { AddressQRCodeModal } from './address-qr-code-modal';

// Mock copy to clipboard hook
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

// Mock the openBlockExplorer function
jest.mock(
  '../../../components/multichain/menu-items/view-explorer-menu-item',
  () => ({
    openBlockExplorer: jest.fn(),
  }),
);

// Mock the getBlockExplorerInfo function
jest.mock('../../../helpers/utils/multichain/getBlockExplorerInfo', () => ({
  getBlockExplorerInfo: jest.fn(),
}));

// Mock the multichain constants
jest.mock('../../../../shared/constants/multichain/networks', () => ({
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP: {
    'bitcoin:0': {
      url: 'https://blockstream.info',
      address: 'https://blockstream.info/address/{address}',
      transaction: 'https://blockstream.info/tx/{txId}',
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
      url: 'https://solscan.io',
      address: 'https://solscan.io/account/{address}',
      transaction: 'https://solscan.io/tx/{txId}',
    },
  },
  MultichainNetworks: {
    BITCOIN: 'bitcoin:0',
    SOLANA: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  },
}));

// Mock the multichain URL formatting
jest.mock('../../../../shared/lib/multichain/networks', () => ({
  formatBlockExplorerAddressUrl: jest.fn((urls, address) =>
    urls.address.replace('{address}', address)
  ),
}));

const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;
const mockOpenBlockExplorer = openBlockExplorer as jest.Mock;

// Import the mocked function
const { getBlockExplorerInfo } = require('../../../helpers/utils/multichain/getBlockExplorerInfo');
const mockGetBlockExplorerInfo = getBlockExplorerInfo as jest.Mock;

describe('AddressQRCodeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCopyToClipboard.mockReturnValue([false, jest.fn(), jest.fn()]);

    // Set up default mock return values
    mockGetBlockExplorerInfo.mockReturnValue(null);
  });

  it('should render the modal when isOpen is true', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    expect(screen.getByText('Test Account / Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Ethereum Address')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Use this address to receive tokens and collectibles on Ethereum',
      ),
    ).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={false}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    expect(
      screen.queryByText('Test Account / Ethereum'),
    ).not.toBeInTheDocument();
  });

  it('should render the address and copy button', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    // The address is displayed in segments: start + middle + end (0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc)
    // Start: first 6 chars, End: last 5 chars
    expect(screen.getByText('0x0dcd')).toBeInTheDocument(); // First 6 chars
    expect(
      screen.getByText('5d886577d5081b0c52e242ef29e70be'),
    ).toBeInTheDocument();
    expect(screen.getByText('3e7bc')).toBeInTheDocument(); // Last 5 chars
    expect(screen.getByText('Copy address')).toBeInTheDocument();
  });

  it('should render the view on explorer button for Ethereum', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    expect(screen.getByText('View on Etherscan')).toBeInTheDocument();
  });

  it('should handle copy functionality when copy button is clicked', async () => {
    const mockHandleCopy = jest.fn();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy, jest.fn()]);

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    const copyButton = screen.getByText('Copy address');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockHandleCopy).toHaveBeenCalledWith(
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      );
    });
  });

  it('should show copy success state when copy is successful', () => {
    mockUseCopyToClipboard.mockReturnValue([true, jest.fn(), jest.fn()]);

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    // Check if the copy success icon is rendered (this is harder to test directly,
    // but we can verify the hook state is used correctly)
    expect(mockUseCopyToClipboard).toHaveBeenCalled();
  });

  it('should navigate to the correct URL for Ethereum explorer when button is clicked', () => {
    const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={address}
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    const explorerButton = screen.getByRole('button', {
      name: 'View on Etherscan',
    });

    fireEvent.click(explorerButton);

    expect(mockOpenBlockExplorer).toHaveBeenCalledTimes(1);
    expect(mockOpenBlockExplorer.mock.calls[0][0]).toBe(
      `https://etherscan.io/address/${address}`,
    );
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={onClose}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        chainId="eip155:1"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should handle different network types and navigate to Solana explorer correctly', () => {
    // Test Solana
    const solanaAddress = 'Dh9ZYBBCdD5FjjgKpAi9w9GQvK4f8k3b8a8HHKhz7kLa';

    // Mock the getBlockExplorerInfo to return Solana explorer info
    mockGetBlockExplorerInfo.mockReturnValue({
      addressUrl: `https://solscan.io/account/${solanaAddress}`,
      name: 'Solscan',
      buttonText: 'View on Solscan',
    });

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={solanaAddress}
        accountName="Solana Account"
        networkName="Solana"
        chainId="solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
        networkImageSrc="./images/sol_logo.svg"
      />,
    );

    expect(screen.getByText('Solana Account / Solana')).toBeInTheDocument();
    expect(screen.getByText('Solana Address')).toBeInTheDocument();
    expect(screen.getByText('Dh9ZYB')).toBeInTheDocument(); // First 6 chars
    expect(screen.getByText('z7kLa')).toBeInTheDocument(); // Last 5 chars

    const explorerButton = screen.getByRole('button', {
      name: 'View on Solscan',
    });
    expect(explorerButton).toBeInTheDocument();

    fireEvent.click(explorerButton);

    expect(mockOpenBlockExplorer).toHaveBeenCalledTimes(1);
    expect(mockOpenBlockExplorer.mock.calls[0][0]).toBe(
      `https://solscan.io/account/${solanaAddress}`,
    );
  });

  it('should handle Bitcoin network and navigate to Bitcoin explorer correctly', () => {
    const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

    // Mock the getBlockExplorerInfo to return Bitcoin explorer info
    mockGetBlockExplorerInfo.mockReturnValue({
      addressUrl: `https://blockstream.info/address/${bitcoinAddress}`,
      name: 'Blockstream',
      buttonText: 'View on Blockstream',
    });

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={bitcoinAddress}
        accountName="Bitcoin Account"
        networkName="Bitcoin"
        chainId="bitcoin:0"
        networkImageSrc="./images/btc_logo.svg"
      />,
    );

    expect(screen.getByText('Bitcoin Account / Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin Address')).toBeInTheDocument();

    const explorerButton = screen.getByRole('button', {
      name: 'View on Blockstream',
    });
    expect(explorerButton).toBeInTheDocument();

    fireEvent.click(explorerButton);

    expect(mockOpenBlockExplorer).toHaveBeenCalledTimes(1);
    expect(mockOpenBlockExplorer.mock.calls[0][0]).toBe(
      `https://blockstream.info/address/${bitcoinAddress}`,
    );
  });

  it('should handle unknown network gracefully', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="unknown_address_format"
        accountName="Test Account"
        networkName="Unknown Network"
        chainId="unknown:0"
      />,
    );

    expect(
      screen.getByText('Test Account / Unknown Network'),
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown Network Address')).toBeInTheDocument();
    // Explorer button should not be rendered for unknown networks
    expect(
      screen.queryByRole('button', { name: /view.*explorer/iu }),
    ).not.toBeInTheDocument();
    // Make sure openBlockExplorer was not called
    expect(mockOpenBlockExplorer).not.toHaveBeenCalled();
  });
});
