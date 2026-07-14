/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import configureStore from '../../../store/store';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import MusdEducationScreen from './education';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

// Mock useMusdConversion hook
const mockStartConversionFlow = jest.fn().mockResolvedValue(undefined);
const mockUseMusdGeoBlocking = jest.fn().mockReturnValue({
  isBlocked: false,
  userCountry: 'US',
  isLoading: false,
});
const mockDefaultPaymentToken = { address: '0xAbc', chainId: '0x1' };
const mockUseMusdConversionTokens = jest.fn().mockReturnValue({
  tokens: [{ address: '0xabc', chainId: '0x1', symbol: 'USDC' }],
  defaultPaymentToken: mockDefaultPaymentToken,
});
const mockUseCanBuyMusd = jest.fn().mockReturnValue({
  canBuyMusdInRegion: true,
  isLoading: false,
});
jest.mock('../../../hooks/musd', () => ({
  useMusdConversion: () => ({
    startConversionFlow: mockStartConversionFlow,
    educationSeen: false,
  }),
  useMusdGeoBlocking: () => mockUseMusdGeoBlocking(),
  useMusdConversionTokens: () => mockUseMusdConversionTokens(),
  useCanBuyMusd: () => mockUseCanBuyMusd(),
}));

const mockGoToBuy = jest.fn().mockResolvedValue(true);
jest.mock(
  '../../../hooks/ramps/useRampsNavigation/useRampsNavigation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => ({ goToBuy: mockGoToBuy }),
  }),
);

// Mock useTheme
jest.mock('../../../hooks/useTheme', () => ({
  useTheme: jest.fn().mockReturnValue('light'),
}));

// Mock Redux dispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// Mock navigate and search params (isDeeplink)
const mockNavigate = jest.fn();
const mockSearchParamsGet = jest.fn().mockReturnValue(null);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [
    {
      get: (key: string) =>
        key === 'isDeeplink' ? mockSearchParamsGet() : null,
    },
  ],
}));

const createMockStore = (remoteFeatureFlags = {}) => {
  return configureStore({
    metamask: {
      remoteFeatureFlags: {
        earnMusdConversionFlowEnabled: true,
        ...remoteFeatureFlags,
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
};

describe('MusdEducationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent.mockResolvedValue(undefined);
    const { useTheme } = jest.requireMock('../../../hooks/useTheme');
    useTheme.mockReturnValue('light');
    mockSearchParamsGet.mockReturnValue(null);
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: false,
      userCountry: 'US',
      isLoading: false,
    });
    mockUseMusdConversionTokens.mockReturnValue({
      tokens: [{ address: '0xabc', chainId: '0x1', symbol: 'USDC' }],
      defaultPaymentToken: mockDefaultPaymentToken,
    });
    mockUseCanBuyMusd.mockReturnValue({
      canBuyMusdInRegion: true,
      isLoading: false,
    });
  });

  it('renders the headline with the bonus percentage', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveStyle({ whiteSpace: 'pre-line' });
    expect(heading.textContent?.replace(/\s+/gu, ' ').trim()).toBe(
      'GET 3% ON STABLECOINS',
    );
  });

  it('renders the body copy', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    expect(
      screen.getByText(/Convert your stablecoins to mUSD/u),
    ).toBeInTheDocument();
  });

  it('renders the illustration image for light theme', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      './images/musd-education-coin-light.png',
    );
  });

  it('renders the illustration image for dark theme', () => {
    const { useTheme } = jest.requireMock('../../../hooks/useTheme');
    useTheme.mockReturnValue('dark');

    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/musd-education-coin-dark.png');
  });

  it('renders the "Get started" primary button', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-continue-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Get started');
  });

  it('renders the "Not now" secondary button', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-not-now-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Not now');
  });

  it('renders the close icon button', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const closeButton = screen.getByTestId('musd-education-skip-button');
    expect(closeButton).toBeInTheDocument();
  });

  it('dispatches setMusdConversionEducationSeen and starts conversion flow on "Get started" click', async () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-continue-button');
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockStartConversionFlow).toHaveBeenCalledWith({
      preferredToken: mockDefaultPaymentToken,
      skipEducation: true,
    });
  });

  it('dispatches setMusdConversionEducationSeen and navigates home on close click', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const closeButton = screen.getByTestId('musd-education-skip-button');
    fireEvent.click(closeButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('dispatches setMusdConversionEducationSeen and navigates home on "Not now" click', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const notNowButton = screen.getByTestId('musd-education-not-now-button');
    fireEvent.click(notNowButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('fires MusdBonusTermsOfUsePressed event when terms of use link is clicked', () => {
    const store = createMockStore();
    const { container } = renderWithProvider(<MusdEducationScreen />, store);

    const termsLink = container.querySelector(
      'a[href="https://metamask.io/musd-bonus-terms-of-use"]',
    ) as HTMLElement;
    expect(termsLink).not.toBeNull();
    fireEvent.click(termsLink);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.MusdBonusTermsOfUsePressed,
        properties: expect.objectContaining({
          location: 'conversion_education_screen',
        }),
      }),
    );
  });

  it('fires MusdFullscreenAnnouncementDisplayed on mount', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.MusdFullscreenAnnouncementDisplayed,
        properties: expect.objectContaining({
          location: 'conversion_education_screen',
        }),
      }),
    );
  });

  it('shows "Continue" when geo-blocked (non-deeplink) and navigates home on click', () => {
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      userCountry: 'GB',
      isLoading: false,
    });
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-continue-button');
    expect(button).toHaveTextContent('Continue');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    expect(mockStartConversionFlow).not.toHaveBeenCalled();
    expect(mockGoToBuy).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // Deeplink with no eligible conversion tokens
  // -------------------------------------------------------------------

  describe('deeplink with no eligible conversion tokens', () => {
    beforeEach(() => {
      mockSearchParamsGet.mockReturnValue('true');
      mockUseMusdConversionTokens.mockReturnValue({
        tokens: [],
        defaultPaymentToken: null,
      });
    });

    it('routes through goToBuy (mainnet) and returns home when the ramps flag is off', async () => {
      mockUseCanBuyMusd.mockReturnValue({
        canBuyMusdInRegion: true,
        isLoading: false,
      });
      const store = createMockStore();
      renderWithProvider(<MusdEducationScreen />, store);

      const button = screen.getByTestId('musd-education-continue-button');
      expect(button).toHaveTextContent('Buy mUSD');
      fireEvent.click(button);

      expect(mockDispatch).toHaveBeenCalled();
      // Deeplink buy branch pins the fallback chain to mainnet.
      expect(mockGoToBuy).toHaveBeenCalledWith({ chainId: '0x1' });
      // Flag off opens Portfolio in a new tab, so the screen returns home.
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE),
      );
      expect(mockStartConversionFlow).not.toHaveBeenCalled();
    });

    it('routes through goToBuy and stays put (in-app routing) when the ramps flag is on', async () => {
      mockUseCanBuyMusd.mockReturnValue({
        canBuyMusdInRegion: true,
        isLoading: false,
      });
      const store = createMockStore({ rampsEnabled: true });
      renderWithProvider(<MusdEducationScreen />, store);

      const button = screen.getByTestId('musd-education-continue-button');
      fireEvent.click(button);

      await waitFor(() =>
        expect(mockGoToBuy).toHaveBeenCalledWith({ chainId: '0x1' }),
      );
      // goToBuy navigates in-app itself; the screen must not override it home.
      expect(mockNavigate).not.toHaveBeenCalledWith(DEFAULT_ROUTE);
      expect(mockStartConversionFlow).not.toHaveBeenCalled();
    });

    it('shows "Continue" and navigates home when user cannot buy (geo-blocked)', () => {
      mockUseMusdGeoBlocking.mockReturnValue({
        isBlocked: true,
        userCountry: 'GB',
        isLoading: false,
      });
      mockUseCanBuyMusd.mockReturnValue({
        canBuyMusdInRegion: false,
        isLoading: false,
      });
      const store = createMockStore();
      renderWithProvider(<MusdEducationScreen />, store);

      const button = screen.getByTestId('musd-education-continue-button');
      expect(button).toHaveTextContent('Continue');
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      expect(mockStartConversionFlow).not.toHaveBeenCalled();
      expect(mockGoToBuy).not.toHaveBeenCalled();
    });

    it('shows "Continue" and navigates home when ramp unavailable in region', () => {
      mockUseCanBuyMusd.mockReturnValue({
        canBuyMusdInRegion: false,
        isLoading: false,
      });
      const store = createMockStore();
      renderWithProvider(<MusdEducationScreen />, store);

      const button = screen.getByTestId('musd-education-continue-button');
      expect(button).toHaveTextContent('Continue');
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      expect(mockStartConversionFlow).not.toHaveBeenCalled();
      expect(mockGoToBuy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // Deeplink with eligible conversion tokens
  // -------------------------------------------------------------------

  describe('deeplink with eligible conversion tokens', () => {
    beforeEach(() => {
      mockSearchParamsGet.mockReturnValue('true');
      mockUseMusdConversionTokens.mockReturnValue({
        tokens: [{ address: '0xabc', chainId: '0x1', symbol: 'USDC' }],
        defaultPaymentToken: mockDefaultPaymentToken,
      });
    });

    it('shows "Get started" and starts conversion flow', async () => {
      const store = createMockStore();
      renderWithProvider(<MusdEducationScreen />, store);

      const button = screen.getByTestId('musd-education-continue-button');
      expect(button).toHaveTextContent('Get started');
      fireEvent.click(button);

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockStartConversionFlow).toHaveBeenCalledWith({
        preferredToken: mockDefaultPaymentToken,
        skipEducation: true,
        entryPoint: 'deeplink',
      });
      expect(mockGoToBuy).not.toHaveBeenCalled();
    });

    it('shows "Get started" and starts conversion flow even when user cannot buy in region', async () => {
      mockUseCanBuyMusd.mockReturnValue({
        canBuyMusdInRegion: false,
        isLoading: false,
      });
      const store = createMockStore();
      renderWithProvider(<MusdEducationScreen />, store);

      const button = screen.getByTestId('musd-education-continue-button');
      expect(button).toHaveTextContent('Get started');
      fireEvent.click(button);

      expect(mockDispatch).toHaveBeenCalled();
      expect(mockStartConversionFlow).toHaveBeenCalledWith({
        preferredToken: mockDefaultPaymentToken,
        skipEducation: true,
        entryPoint: 'deeplink',
      });
      expect(mockGoToBuy).not.toHaveBeenCalled();
    });
  });
});
