/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { type RampsToken } from '@metamask/ramps-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { type AssetType } from '../../../components/app/asset-picker';
import { RampsTokenSelectionScreen } from './token-selection';

const mockNavigate = jest.fn();
const mockGoToBuy = jest.fn().mockResolvedValue(true);
const mockOnAssetSelectRef: {
  current?: (asset: AssetType) => void;
} = {};
const mockOnSearchQueryChangeRef: {
  current?: (query: string) => void;
} = {};
const mockOnSelectedChainIdChangeRef: {
  current?: (chainId: string | null) => void;
} = {};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/ramps/useRampsNavigation/useRampsNavigation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({ goToBuy: mockGoToBuy }),
}));

jest.mock('../../../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/lib/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({
    'eip155:1': { chainId: 'eip155:1', name: 'Ethereum Mainnet' },
  })),
}));

jest.mock('../../../components/app/asset-picker', () => ({
  ...jest.requireActual('../../../components/app/asset-picker'),
  Asset: ({
    tokens,
    hideBalances,
    disableMetrics,
    onAssetSelect,
    onSearchQueryChange,
    onSelectedChainIdChange,
    emptyStateMessage,
    endRenderers,
  }: {
    tokens?: AssetType[];
    hideBalances?: boolean;
    disableMetrics?: boolean;
    onAssetSelect?: (asset: AssetType) => void;
    onSearchQueryChange?: (query: string) => void;
    onSelectedChainIdChange?: (chainId: string | null) => void;
    emptyStateMessage?: string;
    endRenderers?: ((asset: AssetType) => React.ReactNode)[];
  }) => {
    mockOnAssetSelectRef.current = onAssetSelect;
    mockOnSearchQueryChangeRef.current = onSearchQueryChange;
    mockOnSelectedChainIdChangeRef.current = onSelectedChainIdChange;

    return (
      <div data-testid="send-asset-picker">
        <span data-testid="hide-balances">{String(hideBalances)}</span>
        <span data-testid="disable-metrics">{String(disableMetrics)}</span>
        <span data-testid="token-count">{tokens?.length ?? 0}</span>
        <span data-testid="empty-state-message">{emptyStateMessage}</span>
        <button
          data-testid="apply-network-filter"
          onClick={() => onSelectedChainIdChange?.('eip155:1')}
        >
          Apply network filter
        </button>
        {(tokens ?? []).map((token) => (
          <div key={token.assetId}>
            <button
              data-testid={`mapped-token-${token.assetId}`}
              onClick={() => onAssetSelect?.(token)}
            >
              {token.symbol}
            </button>
            {endRenderers?.map((renderTag, index) => {
              const tag = renderTag(token);
              return tag ? <div key={index}>{tag}</div> : null;
            })}
          </div>
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
  ...Array.from({ length: 60 }, (_, index) => ({
    assetId: `eip155:1/erc20:0x${(index + 1).toString().padStart(40, '0')}`,
    chainId: 'eip155:1',
    name: `Extra Token ${index + 1}`,
    symbol: `EXT${index + 1}`,
    decimals: 18,
    iconUrl: '',
    tokenSupported: true,
  })),
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

function setScrollMetrics(
  element: HTMLElement,
  metrics: {
    scrollTop?: number;
    clientHeight?: number;
    scrollHeight?: number;
  },
) {
  Object.entries(metrics).forEach(([key, value]) => {
    Object.defineProperty(element, key, { value, configurable: true });
  });
}

jest.mock('../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

const { useRampsController } = jest.requireMock(
  '../../../hooks/ramps/useRampsController',
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
    mockOnSelectedChainIdChangeRef.current = undefined;
    useRampsController.mockReturnValue({
      tokens: { topTokens: mockTopTokens, allTokens: mockAllTokens },
      tokensLoading: false,
      tokensError: null,
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
    expect(screen.getByTestId('empty-state-message')).toHaveTextContent(
      messages.rampsNoTokensAvailable.message,
    );
    expect(
      screen.queryByTestId(
        'mapped-token-eip155:137/erc20:0x0000000000000000000000000000000000000001',
      ),
    ).not.toBeInTheDocument();
  });

  it('reveals the first page of additional tokens when scrolled near the bottom', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(screen.getByTestId('token-count')).toHaveTextContent('1');

    const scrollContainer = screen.getByTestId(
      'ramps-token-selection-scroll-container',
    );
    setScrollMetrics(scrollContainer, {
      scrollTop: 4300,
      clientHeight: 700,
      scrollHeight: 5000,
    });
    fireEvent.scroll(scrollContainer);

    expect(screen.getByTestId('token-count')).toHaveTextContent('51');
  });

  it('reveals all remaining tokens across successive scrolls and selects a token', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    const scrollContainer = screen.getByTestId(
      'ramps-token-selection-scroll-container',
    );
    setScrollMetrics(scrollContainer, {
      scrollTop: 4300,
      clientHeight: 700,
      scrollHeight: 5000,
    });

    fireEvent.scroll(scrollContainer);
    expect(screen.getByTestId('token-count')).toHaveTextContent('51');

    fireEvent.scroll(scrollContainer);
    expect(screen.getByTestId('token-count')).toHaveTextContent('62');

    fireEvent.scroll(scrollContainer);
    expect(screen.getByTestId('token-count')).toHaveTextContent('62');

    fireEvent.click(screen.getByTestId('mapped-token-eip155:1/slip44:60'));

    expect(mockGoToBuy).toHaveBeenCalledWith({
      assetId: 'eip155:1/slip44:60',
      chainId: '0x1',
    });
  });

  it('does not reveal additional tokens when the scroll position is far from the bottom', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    const scrollContainer = screen.getByTestId(
      'ramps-token-selection-scroll-container',
    );
    setScrollMetrics(scrollContainer, {
      scrollTop: 0,
      clientHeight: 700,
      scrollHeight: 5000,
    });

    fireEvent.scroll(scrollContainer);

    expect(screen.getByTestId('token-count')).toHaveTextContent('1');
  });

  it('does not reveal additional tokens while searching', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    act(() => {
      mockOnSearchQueryChangeRef.current?.('USDC');
    });
    expect(screen.getByTestId('token-count')).toHaveTextContent('62');

    const scrollContainer = screen.getByTestId(
      'ramps-token-selection-scroll-container',
    );
    setScrollMetrics(scrollContainer, {
      scrollTop: 4300,
      clientHeight: 700,
      scrollHeight: 5000,
    });
    fireEvent.scroll(scrollContainer);

    expect(screen.getByTestId('token-count')).toHaveTextContent('62');
  });

  it('reveals all tokens on mount when the initial list cannot scroll', () => {
    // The screen keeps revealing pages while the list is too short to scroll,
    // otherwise extra tokens would be unreachable (no scrollbar, no button).
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      get: () => 300,
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      get: () => 300,
      configurable: true,
    });

    try {
      renderWithProvider(
        <RampsTokenSelectionScreen />,
        createStore(),
        '/ramps/token-selection',
      );

      expect(screen.getByTestId('token-count')).toHaveTextContent('62');
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)
        .scrollHeight;
      delete (HTMLElement.prototype as unknown as Record<string, unknown>)
        .clientHeight;
    }
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

    expect(screen.getByTestId('token-count')).toHaveTextContent('62');
    expect(screen.getByTestId('empty-state-message')).toHaveTextContent(
      messages.noTokensMatchSearch.message,
    );
  });

  it('shows all enabled-network tokens when a network filter is active', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(screen.getByTestId('token-count')).toHaveTextContent('1');
    expect(
      screen.queryByTestId(
        'mapped-token-eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('apply-network-filter'));

    expect(screen.getByTestId('token-count')).toHaveTextContent('62');
    expect(
      screen.getByTestId(
        'mapped-token-eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toHaveTextContent(
      messages.noTokensMatchingYourFilters.message,
    );
  });

  it('shows the region-unavailable info button for unsupported tokens', () => {
    useRampsController.mockReturnValue({
      tokens: {
        topTokens: [{ ...mockTopTokens[0], tokenSupported: false }],
        allTokens: [{ ...mockTopTokens[0], tokenSupported: false }],
      },
      tokensLoading: false,
      tokensError: null,
    });

    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(
      screen.getByTestId('ramps-token-unavailable-info-button'),
    ).toBeInTheDocument();
  });

  it('does not show the region-unavailable info button for supported tokens', () => {
    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(
      screen.queryByTestId('ramps-token-unavailable-info-button'),
    ).not.toBeInTheDocument();
  });

  it('shows loading state when tokensLoading is true', () => {
    useRampsController.mockReturnValue({
      tokens: null,
      tokensLoading: true,
      tokensError: null,
    });

    const { container } = renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    const page = screen.getByTestId('ramps-token-selection-loading');

    expect(page).toContainElement(
      screen.getByTestId('ramps-token-selection-back'),
    );
    expect(page.querySelector('.spinner')).toBeInTheDocument();
    // `loading-overlay` is the fixed-position full-screen LoadingScreen that
    // used to cover the header, leaving no way to leave the screen.
    expect(container.querySelector('.loading-overlay')).toBeNull();
    expect(screen.queryByTestId('send-asset-picker')).toBeNull();
  });

  it('shows loading state when tokens are unset and there is no error', () => {
    useRampsController.mockReturnValue({
      tokens: null,
      tokensLoading: false,
      tokensError: null,
    });

    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    expect(
      screen.getByTestId('ramps-token-selection-loading'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('send-asset-picker')).toBeNull();
  });

  it('keeps back navigation available while loading', () => {
    useRampsController.mockReturnValue({
      tokens: null,
      tokensLoading: true,
      tokensError: null,
    });

    renderWithProvider(
      <RampsTokenSelectionScreen />,
      createStore(),
      '/ramps/token-selection',
    );

    fireEvent.click(screen.getByTestId('ramps-token-selection-back'));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows error state when tokensError exists', () => {
    useRampsController.mockReturnValue({
      tokens: null,
      tokensLoading: false,
      tokensError: new Error('failed'),
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
