import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import type { TokenCellProps } from '../../../components/app/assets/token-cell/token-cell';
import TokenCell from '../../../components/app/assets/token-cell';
import DefiDetailsList from './defi-details-list';

jest.mock('../../../components/app/assets/token-cell', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const moduleExports: { default: ReturnType<typeof jest.fn> } = {
    default: jest.fn(() =>
      ReactActual.createElement('div', {
        'data-testid': 'defi-details-token-cell-stub',
      }),
    ),
  };
  Object.defineProperty(moduleExports, '__esModule', { value: true });
  return moduleExports;
});

const mockUseParams = jest
  .fn()
  .mockReturnValue({ chainId: CHAIN_IDS.MAINNET, protocolId: 'aave' });

jest.mock('../../../../ui/hooks/musd/useMusdGeoBlocking', () => ({
  ...jest.requireActual('../../../../ui/hooks/musd/useMusdGeoBlocking'),
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
    error: null,
    blockedRegions: [],
    blockedMessage: null,
    refreshGeolocation: jest.fn(),
  }),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useParams: () => mockUseParams(),
  };
});

const sampleTokens = [
  [
    {
      symbol: 'ETH',
      type: 'underlying' as const,
      address: '0x0',
      name: 'Ethereum',
      decimals: 18,
      balance: 500,
      balanceRaw: '500000000000000000000',
      marketValue: 2000,
      iconUrl: 'https://example.com/eth-icon.png',
    },
    {
      symbol: 'ETH',
      type: 'underlying-claimable' as const,
      address: '0x0',
      name: 'Ethereum',
      decimals: 18,
      balance: 500,
      balanceRaw: '500000000000000000000',
      marketValue: 2000,
      iconUrl: 'https://example.com/eth-icon.png',
    },
  ],
];

describe('DefiDetailsList', () => {
  const store = configureMockStore([thunk])(mockState);
  const MockedTokenCell = TokenCell as jest.MockedFunction<
    (props: TokenCellProps) => React.ReactElement | null
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.clearActions();
    jest.restoreAllMocks();
  });

  it('renders defi details list', () => {
    const { container } = renderWithProvider(
      <DefiDetailsList
        tokens={sampleTokens}
        positionType={'supply'}
        chainId={'0x1'}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('does not pass musd Merkl or convert surfaces to TokenCell (DeFi list is not a Merkl / mUSD home-list surface)', () => {
    renderWithProvider(
      <DefiDetailsList
        tokens={sampleTokens}
        positionType="supply"
        chainId={CHAIN_IDS.MAINNET}
      />,
      store,
    );

    expect(MockedTokenCell).toHaveBeenCalled();
    for (const [props] of MockedTokenCell.mock.calls) {
      expect(props.musd?.merklClaimBonus).toBeUndefined();
      expect(props.musd?.convert).toBeUndefined();
    }
  });
});
