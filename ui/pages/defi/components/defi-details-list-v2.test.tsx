import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type {
  DeFiPositionDetailsSection,
  DeFiUnderlyingPosition,
} from '@metamask/assets-controllers';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import DefiDetailsListV2 from './defi-details-list-v2';

jest.mock('./defi-details-position-cell-v2', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const moduleExports: { default: ReturnType<typeof jest.fn> } = {
    default: jest.fn(({ position }: { position: DeFiUnderlyingPosition }) =>
      ReactActual.createElement('div', {
        'data-testid': `defi-details-position-cell-stub-${position.assetId}`,
      }),
    ),
  };
  Object.defineProperty(moduleExports, '__esModule', { value: true });
  return moduleExports;
});

const stEthPosition: DeFiUnderlyingPosition = {
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

const usdcPosition: DeFiUnderlyingPosition = {
  assetId:
    'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType,
  chainId: 'eip155:1' as CaipChainId,
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  balance: '100',
  marketValue: 100,
  positionType: 'deposit',
  poolAddress: '0xpool2',
  groupId: 'group-aave-1',
  tokenImage: 'usdc.png',
};

const sections: DeFiPositionDetailsSection[] = [
  {
    productName: 'Lido Staking',
    positions: [stEthPosition],
  },
  {
    productName: 'Aave Supply',
    positions: [usdcPosition],
  },
];

describe('DefiDetailsListV2', () => {
  const store = configureMockStore([thunk])(mockState);

  it('renders section labels and position cells', () => {
    renderWithProvider(<DefiDetailsListV2 sections={sections} />, store);

    expect(
      screen.getByTestId('defi-details-list-v2-Lido Staking-section'),
    ).toHaveTextContent('Lido Staking');
    expect(
      screen.getByTestId('defi-details-list-v2-Aave Supply-section'),
    ).toHaveTextContent('Aave Supply');
    expect(
      screen.getByTestId(
        `defi-details-position-cell-stub-${stEthPosition.assetId}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `defi-details-position-cell-stub-${usdcPosition.assetId}`,
      ),
    ).toBeInTheDocument();
  });

  it('renders a separator between sections but not after the last section', () => {
    renderWithProvider(<DefiDetailsListV2 sections={sections} />, store);

    expect(
      screen.getAllByTestId('defi-details-list-v2-section-separator'),
    ).toHaveLength(1);
  });

  it('renders same-asset positions from different pools as distinct rows', () => {
    const sharedAssetId =
      'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;
    const poolOnePosition: DeFiUnderlyingPosition = {
      ...usdcPosition,
      assetId: sharedAssetId,
      positionType: 'deposit',
      poolAddress: '0xpool-a',
      groupId: 'group-pool-a',
    };
    const poolTwoPosition: DeFiUnderlyingPosition = {
      ...usdcPosition,
      assetId: sharedAssetId,
      positionType: 'deposit',
      poolAddress: '0xpool-b',
      groupId: 'group-pool-b',
    };

    renderWithProvider(
      <DefiDetailsListV2
        sections={[
          {
            productName: 'Multi Pool Supply',
            positions: [poolOnePosition, poolTwoPosition],
          },
        ]}
      />,
      store,
    );

    expect(
      screen.getAllByTestId(`defi-details-position-cell-stub-${sharedAssetId}`),
    ).toHaveLength(2);
  });
});
