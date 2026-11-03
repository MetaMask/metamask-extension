import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, act, waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { DeFiProtocolPosition } from '../types';
import DeFiList from './defi-list';
import { type DefiPositionsList } from './useDefiPositionsList';

const lidoItems: DeFiProtocolPosition[] = [
  {
    protocolId: 'lido',
    title: 'Lido',
    tokenImage: 'logo.png',
    underlyingSymbols: ['stETH'],
    marketValue: '$20,000.00',
    chainId: '0x5' as Hex,
    iconGroup: [{ symbol: 'stETH', avatarValue: 'logo.png' }],
  },
];

const mountainItems: DeFiProtocolPosition[] = [
  {
    protocolId: 'mountain-protocol',
    title: 'mountain-protocol',
    tokenImage: 'logo.png',
    underlyingSymbols: ['USDC'],
    marketValue: '<$0.01',
    chainId: '0x5' as Hex,
    iconGroup: [{ symbol: 'USDC', avatarValue: 'logo.png' }],
  },
];

const render = (items: DefiPositionsList) => {
  const store = configureMockStore([thunk])(mockState);
  return renderWithProvider(
    <DeFiList items={items} onClick={() => undefined} />,
    store,
  );
};

describe('DeFiDetailsPage', () => {
  it('renders error message', async () => {
    await act(async () => {
      render(null);
    });

    await waitFor(() => {
      expect(
        screen.getByText(messages.defiTabErrorTitle.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.defiTabErrorContent.message),
      ).toBeInTheDocument();
    });
  });
  it('readers loading spinner', async () => {
    await act(async () => {
      render(undefined);
    });

    await waitFor(() => {
      expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();
    });
  });
  it('renders positions', async () => {
    await act(async () => {
      render(lidoItems);
    });

    await waitFor(() => {
      expect(screen.getByAltText('stETH')).toHaveAttribute('src', 'logo.png');
      expect(screen.getByText('Lido')).toBeInTheDocument();
      expect(screen.getByText('$20,000.00')).toBeInTheDocument();
      expect(screen.getByText('stETH only')).toBeInTheDocument();
    });
  });
  it('renders low value position', async () => {
    await act(async () => {
      render(mountainItems);
    });

    await waitFor(() => {
      expect(screen.getByAltText('USDC')).toHaveAttribute('src', 'logo.png');
      expect(screen.getByText('mountain-protocol')).toBeInTheDocument();
      const marketValueElement = screen.getByTestId('defi-list-market-value');
      expect(marketValueElement).toBeInTheDocument();
      expect(marketValueElement).toHaveTextContent('<$0.01');
      expect(screen.getByText('USDC only')).toBeInTheDocument();
    });
  });
  it('renders no positions message', async () => {
    await act(async () => {
      render([]);
    });

    await waitFor(() => {
      expect(
        screen.getByText(messages.defiEmptyDescription.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.exploreDefi.message),
      ).toBeInTheDocument();
      expect(screen.getByTestId('defi-tab-empty-state')).toBeInTheDocument();
    });
  });
});
