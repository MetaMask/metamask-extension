/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { BuyGetMusdCtaVariant } from '../../../hooks/musd/useMusdCtaVisibility';
import { MusdBuyGetCta } from './musd-buy-get-cta';

// Mock useI18nContext
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    const translations: Record<string, string> = {
      musdBuyMusd: 'Buy mUSD',
      musdGetMusd: 'Get mUSD',
      musdEarnBonusPercentage: `Earn a ${values?.[0] || '3'}% bonus`,
    };
    return translations[key] || key;
  },
}));

// Mock MetaMetricsContext with a real React context so useContext works,
// but replace Provider with Fragment so the createContext default value is used
jest.mock('../../../contexts/metametrics', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const _trackEvent = jest.fn();
  const MetaMetricsContext = ReactActual.createContext({
    trackEvent: _trackEvent,
    bufferedTrace: jest.fn().mockResolvedValue(undefined),
    bufferedEndTrace: jest.fn().mockResolvedValue(undefined),
    onboardingParentContext: { current: null },
  });
  MetaMetricsContext.Provider = (({
    children,
  }: {
    children: React.ReactNode;
  }) =>
    ReactActual.createElement(
      ReactActual.Fragment,
      null,
      children,
    )) as unknown as typeof MetaMetricsContext.Provider;
  return {
    MetaMetricsContext,
    LegacyMetaMetricsProvider: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(ReactActual.Fragment, null, children),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __mockTrackEvent: _trackEvent,
  };
});
const { __mockTrackEvent: mockTrackEvent } = jest.requireMock<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __mockTrackEvent: jest.Mock;
}>('../../../contexts/metametrics');

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

const mockOpenTab = jest.fn();

const createMockStore = (overrides = {}) => {
  return configureStore({
    metamask: {
      remoteFeatureFlags: {
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: true,
      },
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
              url: 'https://mainnet.infura.io',
            },
          ],
          defaultRpcEndpointIndex: 0,
        },
        '0xe708': {
          chainId: '0xe708',
          name: 'Linea Mainnet',
          rpcEndpoints: [
            {
              networkClientId: 'linea-mainnet',
              url: 'https://linea.infura.io',
            },
          ],
          defaultRpcEndpointIndex: 0,
        },
      },
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': { id: 'account-1', address: '0x123' },
        },
      },
      musdConversionEducationSeen: false,
      musdConversionDismissedCtaKeys: [],
    },
    ...overrides,
  });
};

describe('MusdBuyGetCta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, 'platform', {
      value: { openTab: mockOpenTab },
      writable: true,
    });
  });

  describe('GET variant', () => {
    it('renders "Get mUSD" text for GET variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const elements = screen.getAllByText('Get mUSD');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('calls startConversionFlow when clicked', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('musd-buy-get-cta');
      fireEvent.click(ctaElement);

      expect(mockStartConversionFlow).toHaveBeenCalledWith({
        entryPoint: 'home',
      });
    });

    it('tracks analytics event with GET variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('musd-buy-get-cta');
      fireEvent.click(ctaElement);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            location: 'home_screen',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            cta_type: 'musd_conversion_primary_cta',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
          }),
        }),
      );
    });
  });

  describe('BUY variant', () => {
    it('renders "Buy mUSD" text for BUY variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.BUY}
          selectedChainId="0x1"
        />,
        store,
      );

      const elements = screen.getAllByText('Buy mUSD');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('opens buy crypto page when clicked for BUY variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.BUY}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('musd-buy-get-cta');
      fireEvent.click(ctaElement);

      expect(mockOpenTab).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/buy'),
        }),
      );
    });
  });

  describe('network icon', () => {
    it('shows network icon when showNetworkIcon is true', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
          showNetworkIcon
        />,
        store,
      );

      expect(
        screen.getByTestId('musd-buy-get-cta-network-icon'),
      ).toBeInTheDocument();
    });

    it('hides network icon when showNetworkIcon is false', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
          showNetworkIcon={false}
        />,
        store,
      );

      expect(
        screen.queryByTestId('musd-buy-get-cta-network-icon'),
      ).not.toBeInTheDocument();
    });
  });

  describe('bonus text', () => {
    it('displays bonus percentage in subtitle', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      expect(screen.getByText('Earn a 3% bonus')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('is focusable and keyboard accessible', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('musd-buy-get-cta');
      expect(ctaElement).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('does not render', () => {
    it('returns null when variant is null', () => {
      const store = createMockStore();
      const { container } = renderWithProvider(
        <MusdBuyGetCta variant={null} selectedChainId="0x1" />,
        store,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
