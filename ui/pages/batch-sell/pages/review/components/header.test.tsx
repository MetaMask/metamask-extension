import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { Header } from './header';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: (state: { currency?: string }) => state?.currency,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../components/component-library/skeleton', () => ({
  Skeleton: ({
    isLoading,
    children,
  }: {
    isLoading?: boolean;
    children: React.ReactNode;
  }) => (isLoading ? <div data-testid="skeleton-loading" /> : <>{children}</>),
}));

const mockUseSelector = jest.mocked(useSelector);

function seedSelectors(currency = 'USD') {
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValue(currency as never);
}

const baseProps = {
  quotesAreFetching: false,
  atLeastOneQuoteAvailable: true,
  anyEnabledAsset: true,
  onTotalReceivedFiatIconClick: jest.fn(),
  onSelectReceivedAssetClick: jest.fn(),
};

describe('Header', () => {
  beforeEach(() => {
    seedSelectors();
  });

  describe('static content', () => {
    it('renders the totalReceived label', () => {
      render(
        <Header
          {...baseProps}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      // The label text "totalReceived" appears twice: as the visible label and
      // as the info-button aria-label.
      expect(screen.getAllByText('totalReceived').length).toBeGreaterThan(0);
    });

    it('renders the selected asset symbol', () => {
      render(
        <Header
          {...baseProps}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.getByText('USDC')).toBeInTheDocument();
    });
  });

  describe('formattedTotalReceive', () => {
    it('renders the formatted fiat amount when atLeastOneQuoteAvailable and totalReceivedFiat is provided', () => {
      render(
        <Header
          {...baseProps}
          totalReceivedFiat={1234.56}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.getByText(/1,234/u)).toBeInTheDocument();
    });

    it('renders $0 when atLeastOneQuoteAvailable is false, regardless of totalReceivedFiat', () => {
      render(
        <Header
          {...baseProps}
          atLeastOneQuoteAvailable={false}
          totalReceivedFiat={9999}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.getByText(/\$0/u)).toBeInTheDocument();
      expect(screen.queryByText(/9,999/u)).not.toBeInTheDocument();
    });

    it('renders the hardcoded skeleton placeholder value when atLeastOneQuoteAvailable is true but totalReceivedFiat is undefined', () => {
      render(
        <Header
          {...baseProps}
          atLeastOneQuoteAvailable={true}
          totalReceivedFiat={undefined}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('uses DisplayMd variant for long formatted values (> 10 chars)', () => {
      render(
        <Header
          {...baseProps}
          totalReceivedFiat={1234567890.12}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.getByText(/1,234,567,890/u)).toBeInTheDocument();
    });
  });

  describe('Skeleton loading state', () => {
    it('shows the skeleton when quotes are fetching, any asset is enabled, and no quote is available yet', () => {
      render(
        <Header
          {...baseProps}
          quotesAreFetching={true}
          anyEnabledAsset={true}
          atLeastOneQuoteAvailable={false}
          totalReceivedFiat={undefined}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.getByTestId('skeleton-loading')).toBeInTheDocument();
    });

    it('does not show the skeleton when quotes are not fetching', () => {
      render(
        <Header
          {...baseProps}
          quotesAreFetching={false}
          anyEnabledAsset={true}
          atLeastOneQuoteAvailable={false}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument();
    });

    it('does not show the skeleton when no asset is enabled', () => {
      render(
        <Header
          {...baseProps}
          quotesAreFetching={true}
          anyEnabledAsset={false}
          atLeastOneQuoteAvailable={false}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument();
    });

    it('does not show the skeleton once at least one quote is available', () => {
      render(
        <Header
          {...baseProps}
          quotesAreFetching={true}
          anyEnabledAsset={true}
          atLeastOneQuoteAvailable={true}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
        />,
      );

      expect(screen.queryByTestId('skeleton-loading')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onTotalReceivedFiatIconClick when the info icon is clicked', () => {
      const onTotalReceivedFiatIconClick = jest.fn();

      render(
        <Header
          {...baseProps}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
          onTotalReceivedFiatIconClick={onTotalReceivedFiatIconClick}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'totalReceived' }));

      expect(onTotalReceivedFiatIconClick).toHaveBeenCalledTimes(1);
    });

    it('calls onSelectReceivedAssetClick when the asset button is clicked', () => {
      const onSelectReceivedAssetClick = jest.fn();

      render(
        <Header
          {...baseProps}
          totalReceivedFiat={100}
          selectedAsset={{ symbol: 'USDC' }}
          onSelectReceivedAssetClick={onSelectReceivedAssetClick}
        />,
      );

      fireEvent.click(screen.getByText('USDC'));

      expect(onSelectReceivedAssetClick).toHaveBeenCalledTimes(1);
    });
  });
});
