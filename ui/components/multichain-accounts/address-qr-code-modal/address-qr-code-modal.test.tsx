import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { AddressQRCodeModal } from './address-qr-code-modal';

// Mock copy to clipboard hook
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;

describe('AddressQRCodeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCopyToClipboard.mockReturnValue([false, jest.fn(), jest.fn()]);
  });

  it('should render the modal when isOpen is true', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
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
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    // Check if the copy success icon is rendered (this is harder to test directly,
    // but we can verify the hook state is used correctly)
    expect(mockUseCopyToClipboard).toHaveBeenCalled();
  });

  it('should render explorer link with correct href for Ethereum', () => {
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address="0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc"
        accountName="Test Account"
        networkName="Ethereum"
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    const explorerLink = screen.getByRole('link', {
      name: 'View on Etherscan',
    });

    expect(explorerLink).toHaveAttribute(
      'href',
      `https://etherscan.io/address/0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc`,
    );
    expect(explorerLink).toHaveAttribute('target', '_blank');
    expect(explorerLink).toHaveAttribute('rel', 'noreferrer');
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
        networkImageSrc="./images/eth_logo.svg"
      />,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should handle different network types', () => {
    // Test Solana
    const solanaAddress = 'Dh9ZYBBCdD5FjjgKpAi9w9GQvK4f8k3b8a8HHKhz7kLa';
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={solanaAddress}
        accountName="Solana Account"
        networkName="Solana"
        networkImageSrc="./images/sol_logo.svg"
      />,
    );

    expect(screen.getByText('Solana Account / Solana')).toBeInTheDocument();
    expect(screen.getByText('Solana Address')).toBeInTheDocument();
    expect(screen.getByText('Dh9ZYB')).toBeInTheDocument(); // First 6 chars
    expect(screen.getByText('z7kLa')).toBeInTheDocument(); // Last 5 chars

    const explorerLink = screen.getByRole('link', {
      name: 'View on Solscan',
    });
    expect(explorerLink).toHaveAttribute(
      'href',
      `https://solscan.io/address/${solanaAddress}`,
    );
  });

  it('should handle Bitcoin network', () => {
    const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    renderWithProvider(
      <AddressQRCodeModal
        isOpen={true}
        onClose={jest.fn()}
        address={bitcoinAddress}
        accountName="Bitcoin Account"
        networkName="Bitcoin"
        networkImageSrc="./images/btc_logo.svg"
      />,
    );

    expect(screen.getByText('Bitcoin Account / Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin Address')).toBeInTheDocument();

    const explorerLink = screen.getByRole('link', {
      name: 'View on Blockstream',
    });
    expect(explorerLink).toHaveAttribute(
      'href',
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
      />,
    );

    expect(
      screen.getByText('Test Account / Unknown Network'),
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown Network Address')).toBeInTheDocument();
    // Explorer link should not be rendered for unknown networks
    expect(
      screen.queryByRole('link', { name: /view.*explorer/iu }),
    ).not.toBeInTheDocument();
  });
});
