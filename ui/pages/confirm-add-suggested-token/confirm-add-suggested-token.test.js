import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { acceptWatchAsset, rejectWatchAsset } from '../../store/actions';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/jest/rendering';
import ConfirmAddSuggestedToken from '.';

const MOCK_SUGGESTED_ASSETS = [
  {
    id: 1,
    asset: {
      address: '0x8b175474e89094c44da98b954eedeac495271d0a',
      symbol: 'NEW',
      decimals: 18,
      image: 'metamark.svg',
      unlisted: false,
    },
  },
  {
    id: 2,
    asset: {
      address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
      symbol: '0XYX',
      decimals: 18,
      image: '0x.svg',
      unlisted: false,
    },
  },
];

const MOCK_TOKEN = {
  address: '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d',
  symbol: 'TEST',
  decimals: '0',
};

jest.mock('../../store/actions', () => ({
  acceptWatchAsset: jest.fn().mockReturnValue({ type: 'test' }),
  rejectWatchAsset: jest.fn().mockReturnValue({ type: 'test' }),
}));

const renderComponent = (tokens = []) => {
  const store = configureStore({
    metamask: {
      suggestedAssets: [...MOCK_SUGGESTED_ASSETS],
      tokens,
      provider: { chainId: '0x1' },
    },
    history: {
      mostRecentOverviewPage: '/',
    },
  });
  return renderWithProvider(<ConfirmAddSuggestedToken />, store);
};

describe('ConfirmAddSuggestedToken Component', () => {
  it('should render', () => {
    renderComponent();

    expect(screen.getByText('Add Suggested Tokens')).toBeInTheDocument();
    expect(
      screen.getByText('Would you like to import these tokens?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add Token' }),
    ).toBeInTheDocument();
  });

  it('should render the list of suggested tokens', () => {
    renderComponent();

    for (const { asset } of MOCK_SUGGESTED_ASSETS) {
      expect(screen.getByText(asset.symbol)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img')).toHaveLength(
      MOCK_SUGGESTED_ASSETS.length,
    );
  });

  it('should dispatch acceptWatchAsset when clicking the "Add Token" button', () => {
    renderComponent();
    const addTokenBtn = screen.getByRole('button', { name: 'Add Token' });

    fireEvent.click(addTokenBtn);
    expect(acceptWatchAsset).toHaveBeenCalled();
  });

  it('should dispatch rejectWatchAsset when clicking the "Cancel" button', () => {
    renderComponent();
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });

    expect(rejectWatchAsset).toHaveBeenCalledTimes(0);
    fireEvent.click(cancelBtn);
    expect(rejectWatchAsset).toHaveBeenCalledTimes(
      MOCK_SUGGESTED_ASSETS.length,
    );
  });

  describe('when the suggested token address matches an existing token address', () => {
    it('should show "already listed" warning', () => {
      const mockTokens = [
        {
          ...MOCK_TOKEN,
          address: MOCK_SUGGESTED_ASSETS[0].asset.address,
        },
      ];
      renderComponent(mockTokens);

      expect(
        screen.getByText(
          'This action will edit tokens that are already listed in your wallet, which can be used' +
            ' to phish you. Only approve if you are certain that you mean to change what these' +
            ' tokens represent. Learn more about',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'scams and security risks.' }),
      ).toBeInTheDocument();
    });
  });

  describe('when the suggested token symbol matches an existing token symbol and has a different address', () => {
    it('should show "reuses a symbol" warning', () => {
      const mockTokens = [
        {
          ...MOCK_TOKEN,
          symbol: MOCK_SUGGESTED_ASSETS[0].asset.symbol,
        },
      ];
      renderComponent(mockTokens);

      expect(
        screen.getByText(
          'A token here reuses a symbol from another token you watch, this can be confusing or deceptive.',
        ),
      ).toBeInTheDocument();
    });
  });
});
