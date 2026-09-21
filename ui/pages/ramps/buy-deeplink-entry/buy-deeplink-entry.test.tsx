/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { BuyDeepLinkEntry } from './buy-deeplink-entry';

const DAI_SEARCH =
  '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';

const mockNavigate = jest.fn();
const mockGoToBuy = jest.fn().mockResolvedValue(true);
const globalMockPlatformOpenTab = jest.fn();
let mockOpensBuyInPortfolioTab = false;
let mockSearch = '';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: mockSearch }),
}));

// jsdom environment: `global` is the ambient window; give it a platform mock.
(global as { platform?: object }).platform = {
  openTab: globalMockPlatformOpenTab,
};

jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({
    goToBuy: mockGoToBuy,
    opensBuyInPortfolioTab: mockOpensBuyInPortfolioTab,
  }),
}));

describe('BuyDeepLinkEntry', () => {
  const renderEntry = (search: string) => {
    mockSearch = search;
    return render(<BuyDeepLinkEntry />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpensBuyInPortfolioTab = false;
    mockGoToBuy.mockResolvedValue(true);
  });

  it('calls goToBuy with the intent built from deep link params, once across re-renders', () => {
    const { rerender } = renderEntry(DAI_SEARCH);
    rerender(<BuyDeepLinkEntry />);

    expect(
      screen.getByTestId('ramps-buy-deeplink-entry-loading'),
    ).toBeInTheDocument();
    expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    expect(mockGoToBuy).toHaveBeenCalledWith({
      assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
      chainId: 'eip155:1',
    });
  });

  it('calls goToBuy with no intent when there are no intent params', async () => {
    renderEntry('?utm_source=promo');

    await waitFor(() => {
      expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    });
    expect(mockGoToBuy).toHaveBeenCalledWith(undefined);
  });

  const navigateHomeCases: [string, () => void][] = [
    ['reports it did not navigate', () => mockGoToBuy.mockResolvedValue(false)],
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

  it('opens the legacy Portfolio redirect with verbatim params when the Portfolio fallback applies', async () => {
    mockOpensBuyInPortfolioTab = true;
    renderEntry(DAI_SEARCH);

    await waitFor(() => {
      expect(globalMockPlatformOpenTab).toHaveBeenCalledWith({
        url: 'https://app.metamask.io/buy?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1',
      });
    });
    expect(mockGoToBuy).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});
