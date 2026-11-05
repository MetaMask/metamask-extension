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

  it('renders the token symbol as the title when no name is provided', () => {
    renderHeader();

    expect(screen.getByTestId('asset-name')).toHaveTextContent('USDC');
    expect(
      screen.queryByTestId('asset-page-header-ticker'),
    ).not.toBeInTheDocument();
  });

  it('renders the token name with the ticker on the address row', () => {
    renderHeader({ name: 'USD Coin', symbol: 'USDC' });

    const title = screen.getByTestId('asset-name');
    const ticker = screen.getByTestId('asset-page-header-ticker');

    expect(title).toHaveTextContent('USD Coin');
    expect(title).toHaveClass('text-default');
    expect(ticker).toHaveTextContent('USDC');
    expect(ticker).toHaveClass('text-default');

    const subtitle = screen.getByTestId('asset-page-header-subtitle');
    expect(subtitle).toHaveTextContent('USDC');
    const address = screen.getByTestId('asset-page-header-address');

    expect(subtitle).toHaveTextContent('0x..5831');
    expect(address.querySelector('p')).toHaveClass('text-alternative');
    expect(subtitle).not.toHaveTextContent('USD Coin');
  });

  it('renders an EVM contract address as 0x.. plus its last four characters', () => {
    renderHeader({
      name: '(PoS) Tether USD',
      symbol: 'USDT',
      contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    });

    expect(screen.getByTestId('asset-page-header-ticker')).toHaveTextContent(
      'USDT',
    );
    expect(screen.getByTestId('asset-page-header-address')).toHaveTextContent(
      '0x..86CA',
    );
  });

  it('renders a Solana contract address with its first and last four characters', () => {
    renderHeader({
      name: 'Stonk',
      symbol: 'STONK',
      contractAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    });

    expect(screen.getByTestId('asset-page-header-ticker')).toHaveTextContent(
      'STONK',
    );
    expect(screen.getByTestId('asset-page-header-address')).toHaveTextContent(
      'DezX..B263',
    );
  });

  it('renders a Tron contract address with its first and last four characters', () => {
    renderHeader({
      name: 'Sun Token',
      symbol: 'SUN',
      contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    });

    const subtitle = screen.getByTestId('asset-page-header-subtitle');

    expect(subtitle).toHaveTextContent('SUN');
    expect(subtitle).toHaveTextContent('TR7N..Lj6t');
  });

  it('keeps a short non-EVM address intact', () => {
    renderHeader({
      name: 'Short',
      symbol: 'SHORT',
      contractAddress: 'ABCD1234',
    });

    expect(screen.getByTestId('asset-page-header-address')).toHaveTextContent(
      'ABCD1234',
    );
  });

  it('ellipsizes a long ticker and keeps the contract address on the same line', () => {
    const longTicker = 'SUPERCALIFRAGILISTIC';
    renderHeader({
      name: 'Long Symbol Token',
      symbol: longTicker,
    });

    const ticker = screen.getByTestId('asset-page-header-ticker');
    const address = screen.getByTestId('asset-page-header-address');

    expect(ticker).toHaveTextContent(longTicker);
    expect(ticker).toHaveClass('shrink');
    expect(address).toHaveClass('shrink-0');
    expect(address).toHaveTextContent('0x..5831');
  });

  it('keeps a long native ticker on one line when there is no contract address', () => {
    const longTicker = 'SUPERCALIFRAGILISTIC';
    renderHeader({
      name: 'Long Native Token',
      symbol: longTicker,
      contractAddress: undefined,
    });

    const ticker = screen.getByTestId('asset-page-header-ticker');

    expect(ticker).toHaveTextContent(longTicker);
    expect(ticker).toHaveClass('shrink');
    expect(
      screen.queryByTestId('asset-page-header-address'),
    ).not.toBeInTheDocument();
  });

  it('renders the ticker under the name when there is no contract address', () => {
    renderHeader({
      name: 'Ethereum',
      symbol: 'ETH',
      contractAddress: undefined,
    });

    expect(screen.getByTestId('asset-name')).toHaveTextContent('Ethereum');
    expect(screen.getByTestId('asset-page-header-ticker')).toHaveTextContent(
      'ETH',
    );
    expect(
      screen.queryByTestId('asset-page-header-address'),
    ).not.toBeInTheDocument();
  });

  it('renders the ticker below the name when they differ only by case', () => {
    renderHeader({
      name: 'Pepe',
      symbol: 'PEPE',
      contractAddress: undefined,
    });

    expect(screen.getByTestId('asset-name')).toHaveTextContent('Pepe');
    expect(screen.getByTestId('asset-page-header-ticker')).toHaveTextContent(
      'PEPE',
    );
  });

  it('omits the ticker line when it matches the token name', () => {
    renderHeader({
      name: 'ETH',
      symbol: 'ETH',
      contractAddress: undefined,
    });

    expect(screen.getByTestId('asset-name')).toHaveTextContent('ETH');
    expect(
      screen.queryByTestId('asset-page-header-ticker'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('asset-page-header-subtitle'),
    ).not.toBeInTheDocument();
  });

  it('trims the token name before comparing it with the ticker', () => {
    renderHeader({
      name: '  ETH  ',
      symbol: 'ETH',
      contractAddress: undefined,
    });

    expect(screen.getByTestId('asset-name')).toHaveTextContent('ETH');
    expect(
      screen.queryByTestId('asset-page-header-ticker'),
    ).not.toBeInTheDocument();
  });

  it('renders the token avatar with a network badge', () => {
    renderHeader({ name: 'Chainlink Token', symbol: 'LINK' });

    const avatar = screen.getByTestId('asset-page-header-avatar');
    expect(avatar).toBeInTheDocument();
    expect(screen.getByAltText('Arbitrum One')).toBeInTheDocument();
    expect(avatar.parentElement?.parentElement).toHaveClass('self-center');
    expect(avatar.parentElement?.parentElement).not.toHaveClass('self-start');
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
    it('renders the compact contract address', () => {
      renderHeader();

      expect(screen.getByTestId('asset-page-header-address')).toHaveTextContent(
        '0x..5831',
      );
    });

    it('copies the full contract address when clicked', () => {
      renderHeader();

      fireEvent.click(screen.getByTestId('asset-page-header-address'));

      expect(mockHandleCopy).toHaveBeenCalledWith(CONTRACT_ADDRESS);
    });

    it('shows the copied message in place of the address after copying', () => {
      (useCopyToClipboard as jest.Mock).mockReturnValue([true, mockHandleCopy]);
      renderHeader();

      const addressButton = screen.getByTestId('asset-page-header-address');
      expect(addressButton).toHaveTextContent('tokenContractAddressCopied');
      expect(addressButton).not.toHaveTextContent('0x..5831');
    });

    it('is omitted for native assets without a contract address', () => {
      renderHeader({ symbol: 'ETH', contractAddress: undefined });

      expect(
        screen.queryByTestId('asset-page-header-address'),
      ).not.toBeInTheDocument();
    });
  });
});
