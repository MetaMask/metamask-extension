/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import MusdConversionPage from '.';

const mockUseMusdGeoBlocking = jest.fn().mockReturnValue({
  isBlocked: false,
  isLoading: false,
  userCountry: 'US',
});

jest.mock('../../hooks/musd', () => ({
  useMusdGeoBlocking: () => mockUseMusdGeoBlocking(),
}));

jest.mock('./screens/education', () => {
  const EducationStub = () => (
    <div data-testid="musd-education-screen">Education Screen</div>
  );
  EducationStub.displayName = 'MusdEducationScreen';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return { __esModule: true, default: EducationStub };
});

const mockSearchParamsGet = jest.fn().mockReturnValue(null);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [{ get: mockSearchParamsGet }],
}));

const createMockStore = (overrides: Record<string, unknown> = {}) => {
  return configureStore({
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
      ...overrides,
    },
  });
};

function renderPage(
  store: ReturnType<typeof createMockStore>,
  pathname = '/musd/education',
) {
  return renderWithProvider(
    <Routes>
      <Route path="/musd/*" element={<MusdConversionPage />} />
    </Routes>,
    store,
    pathname,
  );
}

describe('MusdConversionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: false,
      isLoading: false,
      userCountry: 'US',
    });
    mockSearchParamsGet.mockReturnValue(null);
  });

  it('redirects to home when feature flag is disabled', () => {
    const store = createMockStore({
      remoteFeatureFlags: {
        earnMusdConversionFlowEnabled: false,
      },
    });

    renderPage(store);

    expect(
      screen.queryByTestId('musd-education-screen'),
    ).not.toBeInTheDocument();
  });

  it('redirects to home when geo-blocked and not a deeplink', () => {
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      isLoading: false,
      userCountry: 'GB',
    });

    const store = createMockStore();
    renderPage(store);

    expect(
      screen.queryByTestId('musd-education-screen'),
    ).not.toBeInTheDocument();
  });

  it('does not redirect when geo-blocked but IS a deeplink', () => {
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      isLoading: false,
      userCountry: 'GB',
    });
    mockSearchParamsGet.mockReturnValue('true');

    const store = createMockStore();
    renderPage(store);

    expect(screen.getByTestId('musd-education-screen')).toBeInTheDocument();
  });

  it('does not redirect when geo-blocking is still loading', () => {
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      isLoading: true,
      userCountry: null,
    });

    const store = createMockStore();
    renderPage(store);

    expect(screen.getByTestId('musd-education-screen')).toBeInTheDocument();
  });

  it('renders education screen when feature is enabled and not blocked', () => {
    const store = createMockStore();
    renderPage(store);

    expect(screen.getByTestId('musd-education-screen')).toBeInTheDocument();
  });

  it('renders the page container', () => {
    const store = createMockStore();
    const { container } = renderPage(store);

    expect(
      container.querySelector('.musd-conversion-page'),
    ).toBeInTheDocument();
  });
});
