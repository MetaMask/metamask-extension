import React from 'react';
import { screen, act, waitFor, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { DEFI_CONTROLLER_V2_FLAG } from '../../../../../shared/lib/defi-controller-v2/remote-feature-flag';
import DeFiTab from './defi-tab';
import { useDeFiPositionsV2 } from './hooks/useDeFiPositionsV2';

jest.mock('./hooks/useDeFiPositionsV2', () => ({
  useDeFiPositionsV2: jest.fn(),
}));

// AssetListControlBar mounts with effects that call setTokenNetworkFilter →
// setPreference → submitRequestToBackground. Without a background connection
// that warns in unit tests.
jest.mock('../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockUseDeFiPositionsV2 = jest.mocked(useDeFiPositionsV2);
const mockRefresh = jest.fn().mockResolvedValue(undefined);

const selectedAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const stEthIconUrl =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png';

const allDeFiPositions = {
  [selectedAddress]: {
    [CHAIN_IDS.MAINNET]: {
      aggregatedMarketValue: 20540,
      protocols: {
        lido: {
          protocolDetails: {
            name: 'Lido',
            iconUrl: stEthIconUrl,
          },
          aggregatedMarketValue: 20000,
          positionTypes: {
            stake: {
              aggregatedMarketValue: 20000,
              positions: [
                [
                  {
                    address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
                    name: 'Wrapped liquid staked Ether 2.0',
                    symbol: 'wstETH',
                    decimals: 18,
                    balanceRaw: '800000000000000000000',
                    balance: 800,
                    marketValue: 20000,
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                        name: 'Liquid staked Ether 2.0',
                        symbol: 'stETH',
                        decimals: 18,
                        type: 'underlying',
                        balanceRaw: '1000000000000000000',
                        balance: 10,
                        price: 2000,
                        marketValue: 20000,
                        iconUrl: stEthIconUrl,
                      },
                    ],
                  },
                ],
              ],
            },
          },
        },
      },
    },
  },
};

const v2Positions = [
  {
    protocolId: 'lido',
    productName: 'Lido',
    protocolIconUrl: stEthIconUrl,
    chainId: 'eip155:1' as const,
    marketValue: 20000,
    iconGroup: [
      {
        symbol: 'stETH',
        avatarValue: stEthIconUrl,
      },
    ],
    sections: [],
  },
];
const loadingDefiPositions = {
  [selectedAddress]: undefined,
};
const noOpenPositions = {
  [selectedAddress]: [],
};
const defiApiError = null;

const render = (
  state: 'with-positions' | 'loading-positions' | 'error' | 'no-open-positions',
  options?: { defiControllerV2Enabled?: boolean },
) => {
  let selectedDeFiPositions;

  if (state === 'with-positions') {
    selectedDeFiPositions = allDeFiPositions;
  } else if (state === 'loading-positions') {
    selectedDeFiPositions = loadingDefiPositions;
  } else if (state === 'no-open-positions') {
    selectedDeFiPositions = noOpenPositions;
  } else {
    selectedDeFiPositions = defiApiError;
  }

  mockUseDeFiPositionsV2.mockReturnValue({
    positions: options?.defiControllerV2Enabled ? v2Positions : [],
    isLoading: false,
    isError: false,
    refresh: mockRefresh,
  });

  const mockStore = {
    ...mockState,

    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
        },
      },
      allDeFiPositions: selectedDeFiPositions,
      currencyRates: {
        ETH: {
          conversionRate: 1597.32,
        },
      },
      remoteFeatureFlags: {
        ...(options?.defiControllerV2Enabled
          ? { [DEFI_CONTROLLER_V2_FLAG]: { enabled: true } }
          : {}),
      },
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  return renderWithProvider(<DeFiTab onClickAsset={() => undefined} />, store);
};

describe('DefiList', () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    mockRefresh.mockResolvedValue(undefined);
    mockUseDeFiPositionsV2.mockReturnValue({
      positions: [],
      isLoading: false,
      isError: false,
      refresh: mockRefresh,
    });
  });

  it('renders DeFiList component and shows control bar', async () => {
    await act(async () => {
      render('with-positions');
    });

    await waitFor(() => {
      const image = screen.getByAltText('stETH logo');

      expect(screen.getByTestId('defi-list-market-value')).toHaveTextContent(
        '$20,000.00',
      );

      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
      );

      expect(screen.getByTestId('avatar-group')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
  it('renders loading spinner', async () => {
    await act(async () => {
      render('loading-positions');
    });

    await waitFor(() => {
      expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();

      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
  it('renders error message', async () => {
    await act(async () => {
      render('error');
    });

    await waitFor(() => {
      expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
        'We could not load this page.',
      );
      expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
        'Try visiting again later.',
      );
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
  it('renders no positions message', async () => {
    await act(async () => {
      render('no-open-positions');
    });

    await waitFor(() => {
      expect(
        screen.getByText(messages.defiEmptyDescription.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.exploreDefi.message),
      ).toBeInTheDocument();
      expect(screen.getByTestId('defi-tab-empty-state')).toBeInTheDocument();

      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders DefiListV2 when defiControllerV2 is enabled', async () => {
    await act(async () => {
      render('with-positions', { defiControllerV2Enabled: true });
    });

    await waitFor(() => {
      expect(screen.getByTestId('defi-list-market-value')).toHaveTextContent(
        '$20,000.00',
      );
    });
  });

  it('shows a refresh-only menu that refreshes DeFi positions for v2', async () => {
    await act(async () => {
      render('with-positions', { defiControllerV2Enabled: true });
    });

    const actionButton = await screen.findByTestId(
      'asset-list-control-bar-action-button',
    );
    fireEvent.click(actionButton);

    const refreshListButton = await screen.findByTestId('refreshList__button');
    expect(refreshListButton).toHaveTextContent(messages.refreshList.message);
    expect(
      screen.queryByTestId('manageTokens__button'),
    ).not.toBeInTheDocument();

    mockRefresh.mockClear();
    fireEvent.click(refreshListButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
