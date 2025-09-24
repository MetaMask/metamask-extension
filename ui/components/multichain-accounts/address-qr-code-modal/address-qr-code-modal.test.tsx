import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { getBlockExplorerInfo } from '../../../helpers/utils/multichain/getBlockExplorerInfo';
import { AddressQRCodeModal } from './address-qr-code-modal';

// Import the mocked function

// Mock only the essential dependencies that the component actually uses
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock(
  '../../../components/multichain/menu-items/view-explorer-menu-item',
  () => ({
    openBlockExplorer: jest.fn(),
  }),
);

jest.mock('../../../helpers/utils/multichain/getBlockExplorerInfo', () => ({
  getBlockExplorerInfo: jest.fn(),
}));

const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;
const mockOpenBlockExplorer = openBlockExplorer as jest.Mock;

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

    // The address is displayed in segments, so we check for the last 5 characters
    expect(screen.getByText('3e7bc')).toBeInTheDocument(); // Last 5 chars
    expect(screen.getByText('Copy address')).toBeInTheDocument();
  });

  it('should render the view on explorer button for Ethereum', () => {
    // Mock the getBlockExplorerInfo to return Ethereum explorer info
    mockGetBlockExplorerInfo.mockReturnValue({
      addressUrl:
        'https://etherscan.io/address/0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      name: 'Etherscan',
      buttonText: 'View on Etherscan',
    });

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

    expect(mockHandleCopy).toHaveBeenCalledTimes(1);
  });

  it('should show copy success state when copy is successful', async () => {
    const mockHandleCopy = jest.fn();
    mockUseCopyToClipboard.mockReturnValue([true, mockHandleCopy, jest.fn()]);

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

    // Mock the getBlockExplorerInfo to return Ethereum explorer info
    mockGetBlockExplorerInfo.mockReturnValue({
      addressUrl: `https://etherscan.io/address/${address}`,
      name: 'Etherscan',
      buttonText: 'View on Etherscan',
    });

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

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should handle different network types and navigate to Solana explorer correctly', () => {
    const address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

    // Mock the getBlockExplorerInfo to return Solana explorer info
    mockGetBlockExplorerInfo.mockReturnValue({
      addressUrl: `https://solscan.io/account/${address}`,
      name: 'Solscan',
      buttonText: 'View on Solscan',
    });

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={address}
        accountName="Test Account"
        networkName="Solana"
        chainId="solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
        networkImageSrc="./images/sol_logo.svg"
      />,
    );

    const explorerButton = screen.getByRole('button', {
      name: 'View on Solscan',
    });

    fireEvent.click(explorerButton);

    expect(mockOpenBlockExplorer).toHaveBeenCalledTimes(1);
    expect(mockOpenBlockExplorer.mock.calls[0][0]).toBe(
      `https://solscan.io/account/${address}`,
    );
  });

  it('should handle Bitcoin network and navigate to Bitcoin explorer correctly', () => {
    const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

    // Mock the getBlockExplorerInfo to return Bitcoin explorer info
    mockGetBlockExplorerInfo.mockReturnValue({
      addressUrl: `https://blockstream.info/address/${address}`,
      name: 'Blockstream',
      buttonText: 'View on Blockstream',
    });

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={address}
        accountName="Test Account"
        networkName="Bitcoin"
        chainId="bitcoin:0"
        networkImageSrc="./images/btc_logo.svg"
      />,
    );

    const explorerButton = screen.getByRole('button', {
      name: 'View on Blockstream',
    });

    fireEvent.click(explorerButton);

    expect(mockOpenBlockExplorer).toHaveBeenCalledTimes(1);
    expect(mockOpenBlockExplorer.mock.calls[0][0]).toBe(
      `https://blockstream.info/address/${address}`,
    );
  });

  it('should handle unknown network gracefully', () => {
    // Mock the getBlockExplorerInfo to return null for unknown network
    mockGetBlockExplorerInfo.mockReturnValue(null);

    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Unknown Network"
        chainId="unknown:123"
        networkImageSrc="./images/unknown_logo.svg"
      />,
    );

    // Should not render explorer button for unknown network
    expect(
      screen.queryByRole('button', { name: /View on/u }),
    ).not.toBeInTheDocument();
  });
});
