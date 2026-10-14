import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { AssetPageHeader } from './asset-page-header';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const mockHandleCopy = jest.fn();

const CONTRACT_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

const renderHeader = (
  props: Partial<React.ComponentProps<typeof AssetPageHeader>> = {},
) =>
  render(
    <AssetPageHeader
      symbol="USDC"
      image="https://example.com/usdc.png"
      networkImage="https://example.com/arbitrum.png"
      networkName="Arbitrum One"
      contractAddress={CONTRACT_ADDRESS}
      onBack={jest.fn()}
      {...props}
    />,
  );

describe('AssetPageHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCopyToClipboard as jest.Mock).mockReturnValue([false, mockHandleCopy]);
  });

  it('renders the token symbol as the title', () => {
    renderHeader();

    expect(screen.getByTestId('asset-name')).toHaveTextContent('USDC');
  });

  it('renders the token avatar with a network badge', () => {
    renderHeader();

    expect(screen.getByTestId('asset-page-header-avatar')).toBeInTheDocument();
    expect(screen.getByAltText('Arbitrum One')).toBeInTheDocument();
  });

  it('renders badges passed as the title end accessory', () => {
    renderHeader({
      titleEndAccessory: <span data-testid="verified-badge" />,
    });

    expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
  });

  it('renders the end accessory', () => {
    renderHeader({
      endAccessory: <button type="button" data-testid="asset-options" />,
    });

    expect(screen.getByTestId('asset-options')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = jest.fn();
    renderHeader({ onBack });

    fireEvent.click(screen.getByTestId('asset-page-back-button'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe('contract address', () => {
    it('renders the shortened contract address', () => {
      renderHeader();

      expect(screen.getByTestId('asset-page-header-address')).toHaveTextContent(
        '0xaf88d...e5831',
      );
    });

    it('copies the full contract address when clicked', () => {
      renderHeader();

      fireEvent.click(screen.getByTestId('asset-page-header-address'));

      expect(mockHandleCopy).toHaveBeenCalledWith(CONTRACT_ADDRESS);
    });

    it('is omitted for native assets without a contract address', () => {
      renderHeader({ symbol: 'ETH', contractAddress: undefined });

      expect(
        screen.queryByTestId('asset-page-header-address'),
      ).not.toBeInTheDocument();
    });
  });
});
