/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { BuyGetMusdCtaVariant } from '../../../hooks/musd/useMusdCtaVisibility';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { MUSD_CONVERSION_APY } from './constants';
import { MusdBuyGetCta } from './musd-buy-get-cta';

// Mock useI18nContext
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    const translations: Record<string, string> = {
      musdBuyMusd: 'Buy mUSD',
      musdGetMusd: 'Get mUSD',
      musdMetaMaskUsd: 'MetaMask USD',
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
const mockDefaultPaymentToken = { address: '0xUsdc', chainId: '0x1' };
jest.mock('../../../hooks/musd', () => ({
  useMusdConversion: () => ({
    startConversionFlow: mockStartConversionFlow,
    educationSeen: false,
  }),
  useMusdConversionTokens: () => ({
    defaultPaymentToken: mockDefaultPaymentToken,
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
    it('renders MetaMask USD headline and Get mUSD button', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      expect(
        screen.getByText(messages.musdMetaMaskUsd.message),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: messages.musdGetMusd.message }),
      ).toBeInTheDocument();
    });

    it('calls startConversionFlow when row is clicked', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('multichain-token-list-button');
      fireEvent.click(ctaElement);

      expect(mockStartConversionFlow).toHaveBeenCalledWith({
        entryPoint: 'home',
        preferredToken: {
          address: mockDefaultPaymentToken.address,
          chainId: mockDefaultPaymentToken.chainId,
        },
      });
    });

    it('calls startConversionFlow when inner CTA button is clicked', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      fireEvent.click(
        screen.getByRole('button', { name: messages.musdGetMusd.message }),
      );

      expect(mockStartConversionFlow).toHaveBeenCalledWith({
        entryPoint: 'home',
        preferredToken: {
          address: mockDefaultPaymentToken.address,
          chainId: mockDefaultPaymentToken.chainId,
        },
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

      const ctaElement = screen.getByTestId('multichain-token-list-button');
      fireEvent.click(ctaElement);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            location: 'home_screen',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            cta_type: 'musd_conversion_primary_cta',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_chain_id: '0x1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            redirects_to: 'conversion_education_screen',
          }),
        }),
      );
    });
  });

  describe('BUY variant', () => {
    it('renders MetaMask USD headline and Buy mUSD button', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.BUY}
          selectedChainId="0x1"
        />,
        store,
      );

      expect(
        screen.getByText(messages.musdMetaMaskUsd.message),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: messages.musdBuyMusd.message }),
      ).toBeInTheDocument();
    });

    it('opens buy crypto page when row is clicked for BUY variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.BUY}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('multichain-token-list-button');
      fireEvent.click(ctaElement);

      expect(mockOpenTab).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/buy'),
        }),
      );
    });

    it('opens buy crypto page when inner CTA button is clicked for BUY variant', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.BUY}
          selectedChainId="0x1"
        />,
        store,
      );

      fireEvent.click(
        screen.getByRole('button', { name: messages.musdBuyMusd.message }),
      );

      expect(mockOpenTab).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/buy'),
        }),
      );
    });
  });

  describe('CTA button', () => {
    it('renders a native button labeled with GET copy', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const button = screen.getByRole('button', {
        name: messages.musdGetMusd.message,
      });
      expect(button).toHaveClass('musd-buy-get-cta__button');
    });

    it('renders a native button labeled with BUY copy', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.BUY}
          selectedChainId="0x1"
        />,
        store,
      );

      const button = screen.getByRole('button', {
        name: messages.musdBuyMusd.message,
      });
      expect(button).toHaveClass('musd-buy-get-cta__button');
    });
  });

  describe('icon', () => {
    it('always renders the mUSD token icon', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      expect(screen.getByTestId('musd-buy-get-cta-icon')).toBeInTheDocument();
      expect(screen.getByAltText('mUSD logo')).toBeInTheDocument();
    });

    it('renders network badge when selectedChainId is provided', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      expect(screen.getByAltText('Ethereum Mainnet logo')).toBeInTheDocument();
    });

    it('does not render network badge when selectedChainId is null', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId={null}
        />,
        store,
      );

      expect(screen.getByTestId('musd-buy-get-cta-icon')).toBeInTheDocument();
      expect(
        screen.queryByAltText('Ethereum Mainnet logo'),
      ).not.toBeInTheDocument();
    });
  });

  describe('bonus text', () => {
    it('displays MetaMask USD headline and earn-bonus subtitle', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      expect(
        screen.getByText(messages.musdMetaMaskUsd.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          tEn('musdEarnBonusPercentage', [String(MUSD_CONVERSION_APY)]),
        ),
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders row as clickable div with hover styling and inner button', () => {
      const store = createMockStore();
      renderWithProvider(
        <MusdBuyGetCta
          variant={BuyGetMusdCtaVariant.GET}
          selectedChainId="0x1"
        />,
        store,
      );

      const ctaElement = screen.getByTestId('multichain-token-list-button');
      expect(ctaElement.tagName).toBe('DIV');
      expect(ctaElement.className).toContain('hover:bg-hover');
      expect(
        screen.getByRole('button', { name: messages.musdGetMusd.message }),
      ).toBeInTheDocument();
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
