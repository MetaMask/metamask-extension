import React from 'react';
import { fireEvent, screen, render } from '@testing-library/react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MultichainAddressRow } from './multichain-address-row';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('../../../selectors/multichain', () => ({
  getImageForChainId: (chainId: string) => {
    const imageMap: Record<string, string> = {
      '0x1': './images/eth_logo.svg',
      '0x89': './images/polygon_logo.svg',
      '0x539': './images/custom_logo.svg',
    };
    return imageMap[chainId];
  },
}));

// Mock the selectors first, before any imports that might load them
jest.mock('../../../selectors', () => ({
  getMetaMaskAccounts: jest.fn(() => ({})),
  getSelectedAccount: jest.fn(() => ({})),
  getMultichainIsEvm: jest.fn(() => true),
  getNetworkConfigurationsByChainId: jest.fn(() => ({})),
  getCurrentChainId: jest.fn(() => '0x1'),
  getConversionRate: jest.fn(() => 1),
  getNativeCurrency: jest.fn(() => 'ETH'),
  getTokenExchangeRates: jest.fn(() => ({})),
  getTokens: jest.fn(() => []),
  getSelectedAddress: jest.fn(() => '0x123'),
  getAccountsByChainId: jest.fn(() => ({})),
  getBalances: jest.fn(() => ({})),
  getCachedBalances: jest.fn(() => ({})),
}));

const mockHandleCopy = jest.fn();

const defaultProps = {
  chainId: '0x1',
  networkName: 'Ethereum Mainnet',
  address: '0x1234567890123456789012345678901234567890',
};

const renderComponent = (props = {}) => {
  return render(<MultichainAddressRow {...defaultProps} {...props} />);
};

describe('MultichainAddressRow', () => {
  beforeEach(() => {
    mockHandleCopy.mockClear();
    (useCopyToClipboard as jest.Mock).mockReturnValue([false, mockHandleCopy]);
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
      screen.getByTestId('multichain-address-row-qr-button'),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });

  it('handles copy button click', () => {
    renderComponent();

    const copyButton = screen.getByTestId('multichain-address-row-copy-button');
    fireEvent.click(copyButton);

    expect(mockHandleCopy).toHaveBeenCalledWith(defaultProps.address);
  });

  it('renders correctly with different network', () => {
    renderComponent({
      chainId: '0x89',
      networkName: 'Polygon Mainnet',
      address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    });

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Polygon Mainnet');

    expect(
      screen.getByTestId('multichain-address-row-address'),
    ).toHaveTextContent('0xabcde...fabcd');

    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });

  it('shows copy success icon when copied is true', () => {
    (useCopyToClipboard as jest.Mock).mockReturnValueOnce([
      true,
      mockHandleCopy,
    ]);

    renderComponent();

    const copyButton = screen.getByTestId('multichain-address-row-copy-button');

    expect(copyButton).toBeInTheDocument();
  });

  it('handles custom network without image', () => {
    renderComponent({
      chainId: '0x539',
      networkName: 'Custom Network',
      address: '0x9876543210987654321098765432109876543210',
    });

    expect(
      screen.getByTestId('multichain-address-row-network-name'),
    ).toHaveTextContent('Custom Network');

    expect(
      screen.getByTestId('multichain-address-row-address'),
    ).toHaveTextContent('0x98765...43210');

    expect(
      screen.getByTestId('multichain-address-row-network-icon'),
    ).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderComponent({ className: 'custom-class' });

    const addressRow = screen.getByTestId('multichain-address-row');
    expect(addressRow).toHaveClass('custom-class');
  });

  it('handles QR button click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    renderComponent();

    const qrButton = screen.getByTestId('multichain-address-row-qr-button');
    fireEvent.click(qrButton);

    expect(consoleSpy).toHaveBeenCalledWith(
      'QR code clicked for address:',
      defaultProps.address,
    );

    consoleSpy.mockRestore();
  });
});
