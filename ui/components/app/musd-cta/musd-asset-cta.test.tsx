/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { MusdAssetCta } from './musd-asset-cta';

// Mock useI18nContext
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    const translations: Record<string, string> = {
      musdBoostTitle: `Get ${values?.[0] || '3'}% on your stablecoins`,
      musdBoostDescription: `Convert your stablecoins to mUSD and receive up to a ${values?.[0] || '3'}% bonus.`,
      musdConvert: 'Convert',
      dismiss: 'Dismiss',
    };
    return translations[key] || key;
  },
}));

// Mock MetaMetricsContext
const mockTrackEvent = jest.fn();
jest.mock('../../../contexts/metametrics', () => ({
  MetaMetricsContext: {
    Consumer: ({
      children,
    }: {
      children: (value: {
        trackEvent: typeof mockTrackEvent;
      }) => React.ReactNode;
    }) => children({ trackEvent: mockTrackEvent }),
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

// Mock useMusdConversion
const mockStartConversionFlow = jest.fn();
jest.mock('../../../hooks/musd', () => ({
  useMusdConversion: () => ({
    startConversionFlow: mockStartConversionFlow,
    educationSeen: false,
  }),
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
  }),
}));

// Mock Redux dispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const createMockStore = (overrides = {}) => {
  return configureStore({
    metamask: {
      remoteFeatureFlags: {
        earnMusdConversionFlowEnabled: true,
        earnMusdConversionAssetOverviewCtaEnabled: true,
      },
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': { id: 'account-1', address: '0x123' },
        },
      },
    },
    musd: {
      dismissedCtaKeys: [],
      educationSeen: false,
      ...overrides,
    },
  });
};

const mockToken = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  chainId: '0x1',
  symbol: 'USDC',
  balance: '100',
  fiatBalance: '100.00',
};

describe('MusdAssetCta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('card variant', () => {
    it('renders title and description correctly', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      expect(
        screen.getByText('Get 3% on your stablecoins'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Convert your stablecoins to mUSD and receive up to a 3% bonus.',
        ),
      ).toBeInTheDocument();
    });

    it('renders convert button', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      expect(screen.getByText('Convert')).toBeInTheDocument();
    });

    it('calls startConversionFlow when convert button is clicked', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      const convertButton = screen.getByText('Convert');
      fireEvent.click(convertButton);

      expect(mockStartConversionFlow).toHaveBeenCalledWith({
        preferredToken: expect.objectContaining({
          address: mockToken.address,
          chainId: mockToken.chainId,
          symbol: mockToken.symbol,
        }),
        entryPoint: 'asset_overview',
      });
    });

    it('tracks analytics event when convert button is clicked', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      const convertButton = screen.getByText('Convert');
      fireEvent.click(convertButton);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            location: 'asset_overview',
            cta_type: 'musd_conversion_tertiary_cta',
            chain_id: '0x1',
            token_symbol: 'USDC',
          }),
        }),
      );
    });

    it('renders dismiss button', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      const dismissButton = screen.getByTestId('musd-asset-cta-dismiss');
      expect(dismissButton).toBeInTheDocument();
    });

    it('calls onDismiss callback when dismiss button is clicked', () => {
      const mockOnDismiss = jest.fn();
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta
          token={mockToken}
          variant="card"
          onDismiss={mockOnDismiss}
        />,
        store,
      );

      const dismissButton = screen.getByTestId('musd-asset-cta-dismiss');
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('dispatches addDismissedCtaKey action when dismiss button is clicked', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      const dismissButton = screen.getByTestId('musd-asset-cta-dismiss');
      fireEvent.click(dismissButton);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('addDismissedCtaKey'),
          payload: '0x1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        }),
      );
    });

    it('has correct test ID', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      expect(screen.getByTestId('musd-asset-cta')).toBeInTheDocument();
    });
  });

  describe('inline variant', () => {
    it('renders inline version without card styling', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="inline" />,
        store,
      );

      // Inline variant should not have the card-specific dismiss button
      expect(
        screen.queryByTestId('musd-asset-cta-dismiss'),
      ).not.toBeInTheDocument();
    });

    it('renders CTA text in inline variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="inline" />,
        store,
      );

      expect(
        screen.getByText('Get 3% on your stablecoins'),
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('dismiss button has accessible label', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdAssetCta token={mockToken} variant="card" />,
        store,
      );

      const dismissButton = screen.getByTestId('musd-asset-cta-dismiss');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
    });
  });
});
