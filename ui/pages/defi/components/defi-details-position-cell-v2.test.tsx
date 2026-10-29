import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { DeFiUnderlyingPosition } from '@metamask/assets-controllers';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import DefiDetailsPositionCellV2 from './defi-details-position-cell-v2';

jest.mock('../../../components/app/assets/hooks/useTokenDisplayInfo', () => ({
  useTokenDisplayInfo: ({ token }: { token: { title: string } }) => ({
    title: token.title,
    tokenImage: 'token.png',
    primary: '10',
    secondary: '$20,000.00',
  }),
}));

jest.mock('../../../components/app/assets/token-cell/cells', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  return {
    TokenCellPrimaryDisplay: () =>
      ReactActual.createElement('div', {
        'data-testid': 'token-cell-primary-display-stub',
      }),
    TokenCellSecondaryDisplay: () =>
      ReactActual.createElement('div', {
        'data-testid': 'token-cell-secondary-display-stub',
      }),
  };
});

jest.mock(
  '../../../components/app/assets/asset-list/cells/asset-cell-badge',
  () => ({
    AssetCellBadge: () => <div data-testid="asset-cell-badge-stub" />,
  }),
);

const position: DeFiUnderlyingPosition = {
  assetId:
    'eip155:1/erc20:0xae7ab96520de3a18e5e111b5eaab095312d7fe84' as CaipAssetType,
  chainId: 'eip155:1' as CaipChainId,
  symbol: 'stETH',
  name: 'Liquid staked Ether',
  decimals: 18,
  balance: '10',
  marketValue: 20000,
  positionType: 'staked',
  poolAddress: '0xpool',
  groupId: 'group-lido-1',
  tokenImage: 'steth.png',
};

describe('DefiDetailsPositionCellV2', () => {
  const store = configureMockStore([thunk])(mockState);

  it('renders the position name and type tag', () => {
    renderWithProvider(
      <DefiDetailsPositionCellV2 position={position} />,
      store,
    );

    expect(
      screen.getByTestId('multichain-token-list-item-token-name'),
    ).toHaveTextContent('Liquid staked Ether');
    expect(
      screen.getByTestId('defi-details-position-type-tag'),
    ).toHaveTextContent('staked');
    expect(screen.getByTestId('asset-cell-badge-stub')).toBeInTheDocument();
    expect(
      screen.getByTestId('token-cell-secondary-display-stub'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('token-cell-primary-display-stub'),
    ).toBeInTheDocument();
  });

  it('renders a footer spacer so the primary balance stays end-aligned', () => {
    renderWithProvider(
      <DefiDetailsPositionCellV2 position={position} />,
      store,
    );

    expect(
      screen.getByTestId('defi-details-position-footer-spacer'),
    ).toBeInTheDocument();
  });
});
