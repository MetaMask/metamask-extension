import React from 'react';
import { fireEvent, screen, render } from '@testing-library/react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainAddressRow } from './multichain-address-row';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

const mockCopyCallback = jest.fn();
const mockQrCallback = jest.fn();

const defaultProps = {
  chainId: '0x1',
  networkName: 'Ethereum Mainnet',
  address: '0x1234567890123456789012345678901234567890',
  copyActionParams: {
    message: 'Copied!',
    callback: mockCopyCallback,
  },
};

const propsWithQrCode = {
  chainId: '0x1',
  networkName: 'Ethereum Mainnet',
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
    (useCopyToClipboard as jest.Mock).mockReturnValue([
      false,
      mockCopyCallback,
    ]);
  });

  it('renders correctly with all elements', () => {
    renderComponent();

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Ethereum Mainnet');

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
    renderComponent(propsWithQrCode);
    const qrButton = screen.getByTestId('multichain-address-row-qr-button');
    fireEvent.click(qrButton);
    expect(mockQrCallback).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      'Ethereum Mainnet',
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
});
