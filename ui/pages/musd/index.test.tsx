//========
// Changes to this file demonstrate how to test a page with a
// route-within-a-route that also has a messenger.
//========

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
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

function renderPage({
  store,
  uiMessenger,
}: {
  store: ReturnType<typeof createMockStore>;
  uiMessenger: ReturnType<typeof createMockUIMessenger>;
}) {
  return renderWithProvider(<MusdConversionPage />, { store, uiMessenger });
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

    renderPage({ store });

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
    renderPage({ store });

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
    const uiMessenger = createMockUIMessenger();
    renderPage({ store, uiMessenger });

    expect(screen.getByTestId('musd-education-screen')).toBeInTheDocument();
  });

  it('does not redirect when geo-blocking is still loading', () => {
    mockUseMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      isLoading: true,
      userCountry: null,
    });

    const store = createMockStore();
    const uiMessenger = createMockUIMessenger();
    renderPage({ store, uiMessenger });

    expect(screen.getByTestId('musd-education-screen')).toBeInTheDocument();
  });

  it('renders education screen when feature is enabled and not blocked', () => {
    const store = createMockStore();
    const uiMessenger = createMockUIMessenger();
    renderPage({ store, uiMessenger });

    expect(screen.getByTestId('musd-education-screen')).toBeInTheDocument();
  });

  it('renders the page container', () => {
    const store = createMockStore();
    const uiMessenger = createMockUIMessenger();
    const { container } = renderPage({ store, uiMessenger });

    expect(
      container.querySelector('.musd-conversion-page'),
    ).toBeInTheDocument();
  });
});
