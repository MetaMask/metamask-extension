/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { type RampsToken } from '@metamask/ramps-controller';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { type AssetType } from '../../../../components/app/asset-picker';
import { RampsTokenSelectionScreen } from './token-selection';

const mockNavigate = jest.fn();
const mockSetSelectedToken = jest.fn();
const mockOnAssetSelectRef: {
  current?: (asset: AssetType) => void;
} = {};
const mockOnSearchQueryChangeRef: {
  current?: (query: string) => void;
} = {};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../../../../shared/lib/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({
    'eip155:1': { chainId: 'eip155:1', name: 'Ethereum Mainnet' },
  })),
}));

jest.mock('../../../../components/app/asset-picker', () => ({
  ...jest.requireActual('../../../../components/app/asset-picker'),
  Asset: ({
    tokens,
    hideBalances,
    disableMetrics,
    onAssetSelect,
    onSearchQueryChange,
    emptyStateMessage,
  }: {
    tokens?: AssetType[];
    hideBalances?: boolean;
    disableMetrics?: boolean;
    onAssetSelect?: (asset: AssetType) => void;
    onSearchQueryChange?: (query: string) => void;
    emptyStateMessage?: string;
  }) => {
    mockOnAssetSelectRef.current = onAssetSelect;
    mockOnSearchQueryChangeRef.current = onSearchQueryChange;

    return (
      <div data-testid="send-asset-picker">
        <span data-testid="hide-balances">{String(hideBalances)}</span>
        <span data-testid="disable-metrics">{String(disableMetrics)}</span>
        <span data-testid="token-count">{tokens?.length ?? 0}</span>
        <span data-testid="empty-state-message">{emptyStateMessage}</span>
        {(tokens ?? []).map((token) => (
          <button
            key={token.assetId}
            data-testid={`mapped-token-${token.assetId}`}
            onClick={() => onAssetSelect?.(token)}
          >
            {token.symbol}
          </button>
        ))}
      </div>
    );
  },
}));

const mockTopTokens: RampsToken[] = [
  {
    assetId: 'eip155:1/slip44:60',
    chainId: 'eip155:1',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    iconUrl: 'https://example.com/eth.png',
    tokenSupported: true,
  },
];

const mockAllTokens: RampsToken[] = [
  ...mockTopTokens,
  {
    assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chainId: 'eip155:1',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    iconUrl: 'https://example.com/usdc.png',
    tokenSupported: true,
  },
  {
    assetId: 'eip155:137/erc20:0x0000000000000000000000000000000000000001',
    chainId: 'eip155:137',
    name: 'Filtered Out',
    symbol: 'OUT',
    decimals: 18,
    iconUrl: 'https://example.com/out.png',
    tokenSupported: true,
  },
];

jest.mock('../../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

const { useRampsController } = jest.requireMock(
  '../../../../hooks/ramps/useRampsController',
);

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
    },
  });

describe('RampsTokenSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAssetSelectRef.current = undefined;
    mockOnSearchQueryChangeRef.current = undefined;
    useRampsController.mockReturnValue({
      tokens: { topTokens: mockTopTokens, allTokens: mockAllTokens },
      tokensLoading: false,
      tokensError: null,
      setSelectedToken: mockSetSelectedToken,
    });
  });

  it('matches snapshot with send asset picker', () => {
    const { container } = renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(container).toMatchSnapshot();
  });

  it('passes catalog tokens with balances hidden', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(screen.getByTestId('hide-balances')).toHaveTextContent('true');
    expect(screen.getByTestId('disable-metrics')).toHaveTextContent('true');
    expect(screen.getByTestId('token-count')).toHaveTextContent('1');
    expect(
      screen.queryByTestId(
        'mapped-token-eip155:137/erc20:0x0000000000000000000000000000000000000001',
      ),
    ).not.toBeInTheDocument();
  });

  it('expands to all enabled-network tokens and selects a token', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    fireEvent.click(screen.getByTestId('ramps-show-all-tokens'));

    expect(screen.getByTestId('token-count')).toHaveTextContent('2');
    fireEvent.click(screen.getByTestId('mapped-token-eip155:1/slip44:60'));

    expect(mockSetSelectedToken).toHaveBeenCalledWith('eip155:1/slip44:60');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('expands to all tokens when searching', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    act(() => {
      mockOnSearchQueryChangeRef.current?.('USDC');
    });

    expect(screen.getByTestId('token-count')).toHaveTextContent('2');
  });

  it('shows loading and error states', () => {
    useRampsController.mockReturnValue({
      tokens: null,
      tokensLoading: true,
      tokensError: null,
      setSelectedToken: mockSetSelectedToken,
    });

    const { unmount } = renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(screen.queryByTestId('ramps-token-selection-screen')).toBeNull();
    unmount();

    useRampsController.mockReturnValue({
      tokens: null,
      tokensLoading: false,
      tokensError: new Error('failed'),
      setSelectedToken: mockSetSelectedToken,
    });

    const { container } = renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(
      screen.getByTestId('ramps-token-selection-error'),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
