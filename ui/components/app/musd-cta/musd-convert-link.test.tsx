/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
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
  },
  musd: {
    dismissedCtaKeys: [],
    educationSeen: false,
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

  it('renders with bullet separator', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
      />,
      mockStore,
    );

    // Check for bullet point
    const bulletElement = screen.getByText('\u2022');
    expect(bulletElement).toBeInTheDocument();
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
      preferredToken: expect.objectContaining({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: '0x1',
        symbol: 'USDC',
      }),
      entryPoint: 'token_list',
    });
  });

  it('stops event propagation on click', () => {
    const parentClickHandler = jest.fn();

    const { container } = renderWithProvider(
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
          chain_id: '0x1',
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

  it('has correct accessibility attributes', () => {
    renderWithProvider(
      <MusdConvertLink
        tokenAddress="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
        chainId="0x1"
        tokenSymbol="USDC"
      />,
      mockStore,
    );

    const ctaButton = screen.getByTestId('musd-convert-link-0x1');
    expect(ctaButton).toHaveAttribute('tabIndex', '0');
  });
});
