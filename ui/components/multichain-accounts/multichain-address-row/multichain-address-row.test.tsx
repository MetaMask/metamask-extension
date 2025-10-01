import React from 'react';
import { fireEvent, screen, render } from '@testing-library/react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainAddressRow } from './multichain-address-row';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('@metamask/bridge-controller', () => ({
  formatChainIdToCaip: jest.fn(),
}));

const mockCopyCallback = jest.fn();
const mockQrCallback = jest.fn();

const mockFormatChainIdToCaip = formatChainIdToCaip as jest.Mock;

const defaultProps = {
  chainId: '0x1',
  networkName: 'Ethereum',
  address: '0x1234567890123456789012345678901234567890',
  copyActionParams: {
    message: 'Copied!',
    callback: mockCopyCallback,
  },
};

const propsWithQrCode = {
  chainId: '0x1',
  networkName: 'Ethereum',
  address: '0x1234567890123456789012345678901234567890',
  copyActionParams: {
    message: 'Copied!',
    callback: mockCopyCallback,
  },
  qrActionParams: {
    callback: mockQrCallback,
  },
};

const renderComponent = (props = {}) => {
  return render(<MultichainAddressRow {...defaultProps} {...props} />);
};

describe('MultichainAddressRow', () => {
  beforeEach(() => {
    mockCopyCallback.mockClear();
    mockQrCallback.mockClear();
    mockFormatChainIdToCaip.mockClear();
    (useCopyToClipboard as jest.Mock).mockReturnValue([
      false,
      mockCopyCallback,
    ]);
  });

  it('renders correctly with all elements', () => {
    renderComponent();

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Ethereum');

    expect(
      screen.getByTestId('multichain-address-row-address'),
    ).toHaveTextContent('0x12345...67890');

    expect(
      screen.getByTestId('multichain-address-row-copy-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });

  it('does not render QR button when qrActionParams is not provided', () => {
    renderComponent();
    expect(
      screen.queryByTestId('multichain-address-row-qr-button'),
    ).not.toBeInTheDocument();
  });

  it('renders correctly with QR icon element', () => {
    renderComponent(propsWithQrCode);
    expect(
      screen.getByTestId('multichain-address-row-qr-button'),
    ).toBeInTheDocument();
  });

  it('handles empty networkName gracefully', () => {
    renderComponent({
      networkName: '',
    });
    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent(''); // Should render empty content without error
  });

  it('handles empty address gracefully', () => {
    renderComponent({
      address: '',
    });
    expect(
      screen.getByTestId('multichain-address-row-address'),
    ).toHaveTextContent(''); // Should render empty address without error
  });

  it('handles QR button click with onQrClick callback', () => {
    // Mock the formatChainIdToCaip function to return the expected CAIP format
    mockFormatChainIdToCaip.mockReturnValue('eip155:1');

    renderComponent(propsWithQrCode);
    const qrButton = screen.getByTestId('multichain-address-row-qr-button');
    fireEvent.click(qrButton);

    expect(mockFormatChainIdToCaip).toHaveBeenCalledWith('0x1');
    expect(mockQrCallback).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      'Ethereum',
      'eip155:1', // Should be converted to CAIP format
      expect.anything(),
    );
  });

  it('renders fallback content when networkImageSrc is unavailable', () => {
    renderComponent({
      chainId: '0x999', // Non-existing chainId
    });
    const networkIcon = screen.getByTestId(
      'multichain-address-row-network-icon',
    );
    expect(networkIcon).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderComponent({ className: 'custom-class' });
    const addressRow = screen.getByTestId('multichain-address-row');
    expect(addressRow).toHaveClass('custom-class');
  });

  it('converts decimal chainId to CAIP format in QR callback', () => {
    // Mock the formatChainIdToCaip function to return the expected CAIP format
    mockFormatChainIdToCaip.mockReturnValue('eip155:137');

    renderComponent({
      ...propsWithQrCode,
      chainId: '137', // Polygon chain ID as decimal
    });
    const qrButton = screen.getByTestId('multichain-address-row-qr-button');
    fireEvent.click(qrButton);

    expect(mockFormatChainIdToCaip).toHaveBeenCalledWith('137');
    expect(mockQrCallback).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      'Ethereum',
      'eip155:137', // Should be converted to CAIP format
      undefined,
    );
  });

  it('preserves CAIP format chainId in QR callback', () => {
    // Mock the formatChainIdToCaip function to return the same CAIP format
    mockFormatChainIdToCaip.mockReturnValue('eip155:42161');

    renderComponent({
      ...propsWithQrCode,
      chainId: 'eip155:42161', // Arbitrum chain ID already in CAIP format
    });
    const qrButton = screen.getByTestId('multichain-address-row-qr-button');
    fireEvent.click(qrButton);

    expect(mockFormatChainIdToCaip).toHaveBeenCalledWith('eip155:42161');
    expect(mockQrCallback).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      'Ethereum',
      'eip155:42161', // Should remain unchanged
      expect.anything(),
    );
  });
});
