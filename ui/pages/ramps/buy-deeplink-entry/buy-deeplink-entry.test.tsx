/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { BuyDeepLinkEntry } from './buy-deeplink-entry';

const mockNavigate = jest.fn();
const mockGoToBuy = jest.fn().mockResolvedValue(true);
let mockSearch = '';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ search: mockSearch }),
}));

jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({ goToBuy: mockGoToBuy }),
}));

describe('BuyDeepLinkEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGoToBuy.mockResolvedValue(true);
  });

  it('renders a loading state', () => {
    mockSearch =
      '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';
    render(<BuyDeepLinkEntry />);

    expect(
      screen.getByTestId('ramps-buy-deeplink-entry-loading'),
    ).toBeInTheDocument();
  });

  it('calls goToBuy with the assetId built from deep link params', async () => {
    mockSearch =
      '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';
    render(<BuyDeepLinkEntry />);

    await waitFor(() => {
      expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    });
    expect(mockGoToBuy).toHaveBeenCalledWith({
      assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    });
  });

  it('calls goToBuy with no intent when there are no intent params', async () => {
    mockSearch = '?utm_source=promo';
    render(<BuyDeepLinkEntry />);

    await waitFor(() => {
      expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    });
    expect(mockGoToBuy).toHaveBeenCalledWith(undefined);
  });

  it('calls goToBuy once across re-renders', async () => {
    mockSearch =
      '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';
    const { rerender } = render(<BuyDeepLinkEntry />);
    rerender(<BuyDeepLinkEntry />);

    await waitFor(() => {
      expect(mockGoToBuy).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates home when goToBuy reports it did not navigate', async () => {
    mockGoToBuy.mockResolvedValue(false);
    mockSearch =
      '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';
    render(<BuyDeepLinkEntry />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      });
    });
  });

  it('navigates home when goToBuy rejects', async () => {
    mockGoToBuy.mockRejectedValue(new Error('boom'));
    mockSearch =
      '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';
    render(<BuyDeepLinkEntry />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      });
    });
  });
});
