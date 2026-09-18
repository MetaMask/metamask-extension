import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Route, Routes } from 'react-router-dom';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useDeFiPositionsV2 } from '../hooks/useDeFiPositionsV2';
import DeFiDetailsPageV2 from './defi-details-page-v2';

jest.mock('../hooks/useDeFiPositionsV2', () => ({
  useDeFiPositionsV2: jest.fn(),
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value),
  }),
}));

jest.mock('../components/defi-details-list-v2', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const moduleExports: { default: ReturnType<typeof jest.fn> } = {
    default: jest.fn(({ sections }: { sections: { productName: string }[] }) =>
      ReactActual.createElement(
        'div',
        { 'data-testid': 'defi-details-list-v2-stub' },
        sections.map((section) => section.productName).join(','),
      ),
    ),
  };
  Object.defineProperty(moduleExports, '__esModule', { value: true });
  return moduleExports;
});

const mockUseDeFiPositionsV2 = jest.mocked(useDeFiPositionsV2);

const protocolPosition: DeFiProtocolPositionGroup = {
  protocolId: 'lido',
  productName: 'Lido',
  protocolIconUrl: 'lido.png',
  chainId: 'eip155:1' as CaipChainId,
  marketValue: 20000,
  iconGroup: [{ symbol: 'stETH', avatarValue: 'steth.png' }],
  sections: [
    {
      productName: 'Lido Staking',
      positions: [
        {
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
        },
      ],
    },
  ],
};

const renderPage = (path: string) => {
  const store = configureMockStore([thunk])(mockState);

  return renderWithProvider(
    <Routes>
      <Route
        path="/defi/:chainId/:protocolId"
        element={<DeFiDetailsPageV2 />}
      />
      <Route
        path={DEFAULT_ROUTE}
        element={<div data-testid="default-route-page" />}
      />
    </Routes>,
    store,
    path,
  );
};

describe('DeFiDetailsPageV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeFiPositionsV2.mockReturnValue({
      positions: [protocolPosition],
      isLoading: false,
      isError: false,
      refresh: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders loading spinner while positions are loading', () => {
    mockUseDeFiPositionsV2.mockReturnValue({
      positions: [],
      isLoading: true,
      isError: false,
      refresh: jest.fn().mockResolvedValue(undefined),
    });

    renderPage('/defi/eip155:1/lido');

    expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();
  });

  it('redirects to the default route when positions fail to load', () => {
    mockUseDeFiPositionsV2.mockReturnValue({
      positions: [],
      isLoading: false,
      isError: true,
      refresh: jest.fn().mockResolvedValue(undefined),
    });

    renderPage('/defi/eip155:1/lido');

    expect(screen.getByTestId('default-route-page')).toBeInTheDocument();
  });

  it('keeps rendering cached protocol data when a background refresh fails', () => {
    mockUseDeFiPositionsV2.mockReturnValue({
      positions: [protocolPosition],
      isLoading: false,
      isError: true,
      refresh: jest.fn().mockResolvedValue(undefined),
    });

    renderPage('/defi/eip155:1/lido');

    expect(screen.queryByTestId('default-route-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('defi-details-page-title')).toHaveTextContent(
      'lido',
    );
  });

  it('redirects to the default route when the protocol is missing', () => {
    renderPage('/defi/eip155:1/unknown');

    expect(screen.getByTestId('default-route-page')).toBeInTheDocument();
  });

  it('renders protocol details for a matching position', () => {
    renderPage('/defi/eip155:1/lido');

    expect(screen.getByTestId('defi-details-page-title')).toHaveTextContent(
      'lido',
    );
    expect(
      screen.getByTestId('defi-details-page-market-value'),
    ).toHaveTextContent('$20,000.00');
    expect(screen.getByTestId('defi-details-list-v2-stub')).toHaveTextContent(
      'Lido Staking',
    );
  });

  it('navigates home when the back button is clicked', () => {
    renderPage('/defi/eip155:1/lido');

    fireEvent.click(screen.getByTestId('defi-details-page-back-button'));

    expect(screen.getByTestId('default-route-page')).toBeInTheDocument();
  });
});
