/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import RampsCompleteBuyScreen from './complete-buy';
import type { RampsCompleteBuyLocationState } from './types';

const mockNavigate = jest.fn();
let mockLocationState: RampsCompleteBuyLocationState | null = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/ramps/complete-buy',
    state: mockLocationState,
  }),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate-redirect" data-to={to} />
  ),
}));

jest.mock('../../../hooks/ramps/useRampsScreenViewed', () => ({
  useRampsScreenViewed: jest.fn(),
}));

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getImageForChainId: () => 'https://example.com/network.png',
}));

jest.mock('../../../ducks/bridge/utils', () => ({
  ...jest.requireActual('../../../ducks/bridge/utils'),
  getMaybeHexChainId: (chainId?: string) =>
    chainId?.startsWith('eip155:') ? '0x1' : undefined,
}));

jest.mock('../../../components/app/transaction/account-name', () => ({
  AccountName: ({ address }: { address?: string | null }) => (
    <span data-testid="account-name">{address}</span>
  ),
}));

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': {
            id: 'account-1',
            address: '0xabc123',
            metadata: { name: 'Account 1' },
          },
        },
      },
    },
  });

const completeBuyState: RampsCompleteBuyLocationState = {
  checkoutUrl: 'https://provider.example/checkout',
  providerName: 'Transak',
  amountOut: '0.042',
  tokenSymbol: 'ETH',
  tokenIconUrl: 'https://example.com/eth.png',
  tokenChainId: 'eip155:1',
  walletAddress: '0xabc123',
  createdAt: 1_783_382_400_000,
};

describe('RampsCompleteBuyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = completeBuyState;
  });

  it('matches snapshot', () => {
    const { container } = renderWithProvider(
      <RampsCompleteBuyScreen />,
      createStore(),
      '/ramps/complete-buy',
    );

    expect(container).toMatchSnapshot();
  });

  it('redirects home when location state is missing', () => {
    mockLocationState = null;

    renderWithProvider(
      <RampsCompleteBuyScreen />,
      createStore(),
      '/ramps/complete-buy',
    );

    expect(screen.getByTestId('navigate-redirect')).toHaveAttribute(
      'data-to',
      DEFAULT_ROUTE,
    );
  });

  it('navigates home when back to wallet is pressed', () => {
    renderWithProvider(
      <RampsCompleteBuyScreen />,
      createStore(),
      '/ramps/complete-buy',
    );

    fireEvent.click(screen.getByTestId('ramps-complete-buy-back-to-wallet'));

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });
});
