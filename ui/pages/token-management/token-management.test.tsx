import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { TOKEN_MANAGEMENT_ROUTE } from '../../helpers/constants/routes';
import { TokenManagementPage } from './token-management';

jest.mock('../../selectors/assets', () => ({
  ...jest.requireActual('../../selectors/assets'),
  getAssetsBySelectedAccountGroup: (state: {
    metamask?: {
      accountGroupAssets?: Record<string, unknown[]>;
    };
  }) => state.metamask?.accountGroupAssets ?? {},
}));

describe('TokenManagementPage', () => {
  let consoleWarnSpy: jest.SpyInstance;
  const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  const solanaTokenAssetId = `${solanaChainId}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;

  const mainnetToken = {
    accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accountType: 'eip155:eoa',
    assetId: '0x0000000000000000000000000000000000000001',
    address: '0x0000000000000000000000000000000000000001',
    chainId: '0x1',
    image: '',
    name: 'Alpha Token',
    symbol: 'AAA',
    decimals: 18,
    isNative: false,
    rawBalance: '0x1',
    balance: '1.23',
    fiat: {
      balance: 1.23,
      currency: 'usd',
      conversionRate: 1,
    },
  };

  const goerliToken = {
    accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accountType: 'eip155:eoa',
    assetId: '0x0000000000000000000000000000000000000002',
    address: '0x0000000000000000000000000000000000000002',
    chainId: '0x5',
    image: '',
    name: 'Beta Token',
    symbol: 'BBB',
    decimals: 6,
    isNative: false,
    rawBalance: '0x1',
    balance: '4.56',
    fiat: {
      balance: 4.56,
      currency: 'usd',
      conversionRate: 1,
    },
  };

  const nativeToken = {
    accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accountType: 'eip155:eoa',
    assetId: '0x0000000000000000000000000000000000000000',
    address: '0x0000000000000000000000000000000000000000',
    chainId: '0x1',
    image: '',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    rawBalance: '0x1',
    balance: '0.001',
    fiat: {
      balance: 10,
      currency: 'usd',
      conversionRate: 10000,
    },
  };

  const solanaToken = {
    accountId: 'solana-account-id',
    accountType: 'solana:data-account',
    assetId: solanaTokenAssetId,
    chainId: solanaChainId,
    image: '',
    name: 'Solana Token',
    symbol: 'SLT',
    decimals: 6,
    isNative: false,
    rawBalance: '0x1',
    balance: '2.5',
    fiat: {
      balance: 2.5,
      currency: 'usd',
      conversionRate: 1,
    },
  };

  beforeEach(() => {
    const originalWarn = console.warn;
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation((message?: unknown, ...args: unknown[]) => {
        if (typeof message === 'string' && message.includes('componentWill')) {
          return;
        }
        originalWarn(message, ...args);
      });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  const createState = ({
    enabledNetworks = { '0x1': true },
    enabledNetworkMap = { eip155: enabledNetworks },
    accountGroupAssets = {
      '0x1': [mainnetToken, nativeToken],
      '0x5': [goerliToken],
    },
  }: {
    enabledNetworks?: Record<string, boolean>;
    enabledNetworkMap?: Record<string, Record<string, boolean>>;
    accountGroupAssets?: Record<string, unknown[]>;
  } = {}) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      selectedMultichainNetworkChainId: 'eip155:1',
      useExternalServices: true,
      preferences: {
        ...mockState.metamask.preferences,
        tokenSortConfig: {
          key: 'name',
          order: 'asc',
          sortCallback: 'alphaNumeric',
        },
      },
      enabledNetworkMap,
      networkConfigurationsByChainId: {
        ...mockState.metamask.networkConfigurationsByChainId,
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
            },
          ],
        },
        '0x5': {
          chainId: '0x5',
          name: 'Goerli',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'goerli',
            },
          ],
        },
      },
      accountGroupAssets,
    },
  });

  const renderPage = (state = createState()) => {
    const store = configureStore({
      ...state,
    });
    return {
      store,
      ...renderWithProvider(
        <TokenManagementPage />,
        store,
        TOKEN_MANAGEMENT_ROUTE,
      ),
    };
  };

  it('renders without crashing', () => {
    renderPage();
    expect(screen.getByTestId('token-management-page')).toBeInTheDocument();
    expect(
      screen.getByTestId('token-management-header-back-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter token name or address'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('token-management-add-custom-token-button'),
    ).toHaveTextContent('Add a custom token');
    expect(
      screen.queryByTestId('settings-v2-header-close-button'),
    ).not.toBeInTheDocument();
  });

  it('opens the import tokens modal from the sticky add custom token button', () => {
    const { store } = renderPage();

    const addCustomTokenButton = screen.getByTestId(
      'token-management-add-custom-token-button',
    );

    expect(addCustomTokenButton.parentElement).toHaveStyle({
      bottom: '0px',
      position: 'sticky',
    });

    fireEvent.click(addCustomTokenButton);

    expect(store.getState().appState.importTokensModalOpen).toBe(true);
  });

  it('shows tokens from the enabled home-page network filter', () => {
    renderPage();

    expect(screen.getByText('Alpha Token')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.queryByText('Beta Token')).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        'token-management-cell-0x1:0x0000000000000000000000000000000000000001-network-badge',
      ),
    ).toBeInTheDocument();
  });

  it('shows tokens from all enabled networks when the home page filter is all networks', () => {
    renderPage(
      createState({
        enabledNetworks: {
          '0x1': true,
          '0x5': true,
        },
      }),
    );

    expect(screen.getByText('Alpha Token')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Beta Token')).toBeInTheDocument();
    expect(screen.getByText('All default networks')).toBeInTheDocument();
  });

  it('filters visible tokens by name or address', () => {
    renderPage(
      createState({
        enabledNetworks: {
          '0x1': true,
          '0x5': true,
        },
      }),
    );

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'Beta' },
    });

    expect(screen.queryByText('Alpha Token')).not.toBeInTheDocument();
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
    expect(screen.getByText('Beta Token')).toBeInTheDocument();
  });

  it('renders an enabled toggle for non-native Solana tokens', () => {
    renderPage(
      createState({
        enabledNetworkMap: {
          eip155: { '0x1': true },
          solana: { [solanaChainId]: true },
        },
        accountGroupAssets: {
          '0x1': [mainnetToken],
          [solanaChainId]: [solanaToken],
        },
      }),
    );

    const solanaToggle = screen.getByTestId(
      `token-management-cell-${solanaChainId}:${solanaTokenAssetId.toLowerCase()}-toggle`,
    );

    expect(screen.getByText('Solana Token')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `token-management-cell-${solanaChainId}:${solanaTokenAssetId.toLowerCase()}-network-badge`,
      ),
    ).toBeInTheDocument();
    expect(solanaToggle).toBeInTheDocument();
    expect(solanaToggle.closest('.toggle-button')).toHaveClass(
      'toggle-button--on',
    );
    expect(solanaToggle.closest('.toggle-button')).not.toHaveClass(
      'toggle-button--disabled',
    );
  });

  it('renders a disabled on toggle for native tokens', () => {
    renderPage();

    const nativeToggle = screen.getByTestId(
      'token-management-cell-0x1:0x0000000000000000000000000000000000000000-toggle',
    );

    expect(nativeToggle).toBeInTheDocument();
    expect(nativeToggle.closest('.toggle-button')).toHaveClass(
      'toggle-button--on',
      'toggle-button--disabled',
    );
    expect(
      screen.getByTestId(
        'token-management-cell-0x1:0x0000000000000000000000000000000000000001-toggle',
      ),
    ).toBeInTheDocument();
  });
});
