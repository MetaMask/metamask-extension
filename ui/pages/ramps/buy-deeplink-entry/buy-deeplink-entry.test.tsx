/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { BuyDeepLinkEntry } from './buy-deeplink-entry';

const DAI_SEARCH =
  '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';
const PORTFOLIO_URL =
  'https://app.metamask.io/buy?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';

const mockNavigate = jest.fn();
const mockGoToBuy = jest.fn().mockResolvedValue('native');
const globalMockPlatformOpenTab = jest.fn();
let mockIsUnifiedBuyEnabled = true;
let mockSearch = '';
let mockKey = 'abc';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: mockSearch, key: mockKey }),
}));

// jsdom environment: `global` is the ambient window; give it a platform mock.
(global as { platform?: object }).platform = {
  openTab: globalMockPlatformOpenTab,
};

jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({
    // Fresh reference each render so dependency changes are exercised.
    goToBuy: (...args: unknown[]) => mockGoToBuy(...args),
    isUnifiedBuyEnabled: mockIsUnifiedBuyEnabled,
  }),
}));

describe('BuyDeepLinkEntry', () => {
  const renderEntry = (search: string) => {
    mockSearch = search;
    return render(<BuyDeepLinkEntry />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsUnifiedBuyEnabled = true;
    mockKey = 'abc';
    mockGoToBuy.mockResolvedValue('native');
  });

  it('calls goToBuy with the intent built from deep link params, once across re-renders', () => {
    const { rerender } = renderEntry(DAI_SEARCH);
    rerender(<BuyDeepLinkEntry />);

    expect(
      screen.getByTestId('ramps-buy-deeplink-entry-loading'),
    ).toBeInTheDocument();
    expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    expect(mockGoToBuy).toHaveBeenCalledWith(
      {
        assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
      },
      {
        replace: true,
        portfolioRedirectUrl: PORTFOLIO_URL,
      },
    );
  });

  it('calls goToBuy with no intent when there are no intent params', async () => {
    renderEntry('?utm_source=promo');

    await waitFor(() => {
      expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    });
    expect(mockGoToBuy).toHaveBeenCalledWith(undefined, {
      replace: true,
      portfolioRedirectUrl: 'https://app.metamask.io/buy?utm_source=promo',
    });
  });

  const navigateHomeCases: [string, () => void][] = [
    ['is blocked by a modal', () => mockGoToBuy.mockResolvedValue(false)],
    ['opens Portfolio', () => mockGoToBuy.mockResolvedValue('portfolio')],
    ['rejects', () => mockGoToBuy.mockRejectedValue(new Error('boom'))],
  ];
  for (const [label, arrange] of navigateHomeCases) {
    it(`navigates home when goToBuy ${label}`, async () => {
      arrange();
      renderEntry(DAI_SEARCH);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
          replace: true,
        });
      });
    });
  }

  it('does not cancel the in-flight navigation when dependencies change mid-flight', async () => {
    // `goToBuy`'s identity changes when the user's region/catalog resolve.
    // The cleanup must be unmount-only: a dep change cancels the in-flight
    // navigation and the effect re-runs into the hasInitiatedRef guard,
    // stranding the user on the spinner.
    let resolveGoToBuy: (value: false) => void = () => undefined;
    mockGoToBuy.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveGoToBuy = resolve;
        }),
    );
    const { rerender } = renderEntry(DAI_SEARCH);
    rerender(<BuyDeepLinkEntry />);

    resolveGoToBuy(false);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      });
    });
  });

  it('does not navigate after unmount', async () => {
    let resolveGoToBuy: (value: false) => void = () => undefined;
    mockGoToBuy.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveGoToBuy = resolve;
        }),
    );
    const { unmount } = renderEntry(DAI_SEARCH);
    unmount();

    await act(async () => {
      resolveGoToBuy(false);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects in place to Portfolio with verbatim params when unified buy is disabled', async () => {
    mockIsUnifiedBuyEnabled = false;
    mockKey = 'default';
    const originalLocation = window.location;
    const locationMock: { href: string } = { href: '' };
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
    });

    try {
      renderEntry(DAI_SEARCH);

      await waitFor(() => {
        expect(locationMock.href).toBe(PORTFOLIO_URL);
      });
    } finally {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    }

    expect(globalMockPlatformOpenTab).not.toHaveBeenCalled();
    expect(mockGoToBuy).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('returns home when the navigation gate opens Portfolio in a new tab', async () => {
    mockGoToBuy.mockResolvedValue('portfolio');
    renderEntry(DAI_SEARCH);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      });
    });
    expect(mockGoToBuy).toHaveBeenCalledWith(
      { assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' },
      {
        replace: true,
        portfolioRedirectUrl: PORTFOLIO_URL,
      },
    );
    expect(globalMockPlatformOpenTab).not.toHaveBeenCalled();
  });
});
