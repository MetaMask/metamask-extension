/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { MusdConvertLink } from './musd-convert-link';

// Mock useI18nContext
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, values?: string[]) => {
    if (key === 'musdGetBonusPercentage') {
      return `Get ${values?.[0] || '3'}% bonus`;
    }
    return key;
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

const mockStore = configureStore({
  metamask: {
    remoteFeatureFlags: {
      earnMusdConversionFlowEnabled: true,
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
    musdConversionEducationSeen: false,
    musdConversionDismissedCtaKeys: [],
  },
});

describe('MusdConvertLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the CTA text correctly', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
      />,
      mockStore,
    );

    expect(screen.getByText('Get 3% bonus')).toBeInTheDocument();
  });

  it('calls startConversionFlow on click', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
      />,
      mockStore,
    );

    const ctaButton = screen.getByTestId('musd-convert-link-0x1');
    fireEvent.click(ctaButton);

    expect(mockStartConversionFlow).toHaveBeenCalledWith({
      preferredToken: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: '0x1',
      },
      entryPoint: 'token_list',
    });
  });

  it('stops event propagation on click', () => {
    const parentClickHandler = jest.fn();

    renderWithProvider(
      <div onClick={parentClickHandler}>
        <MusdConvertLink
          tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          chainId="0x1"
          tokenSymbol="USDC"
        />
      </div>,
      mockStore,
    );

    const ctaButton = screen.getByTestId('musd-convert-link-0x1');
    fireEvent.click(ctaButton);

    // Parent should not receive the click event
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('tracks analytics event on click', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
      />,
      mockStore,
    );

    const ctaButton = screen.getByTestId('musd-convert-link-0x1');
    fireEvent.click(ctaButton);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: expect.any(String),
        properties: expect.objectContaining({
          location: 'token_list_item',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: 'USDC',
        }),
      }),
    );
  });

  it('uses custom entry point when provided', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
        entryPoint="asset_overview"
      />,
      mockStore,
    );

    const ctaButton = screen.getByTestId('musd-convert-link-0x1');
    fireEvent.click(ctaButton);

    expect(mockStartConversionFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPoint: 'asset_overview',
      }),
    );
  });

  it('renders with custom CTA text when provided', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
        ctaText="Custom CTA Text"
      />,
      mockStore,
    );

    expect(screen.getByText('Custom CTA Text')).toBeInTheDocument();
  });

  it('renders as an accessible button element', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
      />,
      mockStore,
    );

    const ctaButton = screen.getByTestId('musd-convert-link-0x1');
    expect(ctaButton.tagName).toBe('BUTTON');
    expect(ctaButton).toHaveAttribute('type', 'button');
  });
});
