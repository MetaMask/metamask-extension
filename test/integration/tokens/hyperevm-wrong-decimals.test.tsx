import { act, fireEvent, screen, within } from '@testing-library/react';
import nock from 'nock';
import type { CaipAssetType } from '@metamask/utils';
import { AccountOverviewTabKey } from '../../../shared/constants/app-state';
import {
  CHAIN_IDS,
  HYPEREVM_DISPLAY_NAME,
} from '../../../shared/constants/network';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { integrationTestRender } from '../../lib/render-helpers';
import mockMetaMaskState from '../data/integration-init-state.json';
import {
  clickElementById,
  createMockImplementation,
  getSelectedAccountGroupAccounts,
  getSelectedAccountGroupName,
} from '../helpers';

jest.setTimeout(30_000);

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../ui/hooks/musd/useMusdGeoBlocking', () => ({
  ...jest.requireActual('../../../ui/hooks/musd/useMusdGeoBlocking'),
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

jest.mock('react-chartjs-2', () => {
  const React = jest.requireActual('react');
  return {
    Line: React.forwardRef(() => null),
  };
});

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...mockRequests,
    }),
  );
};

const FRXUSD_SYMBOL = 'frxUSD';
const FRXUSD_DECIMALS = 6;
const FRXUSD_HUMAN_BALANCE = '11.811649';
const FRXUSD_ADDRESS = '0xcacd6fd266af91b8aed52accc382b4e165586e29';
const FRXUSD_ASSET_ID = `eip155:999/erc20:${FRXUSD_ADDRESS}` as CaipAssetType;
/**
 * `formatTokenQuantity` uses Intl decimal style with max 3 fraction digits,
 * so 11.811649 renders as 11.812. Treating the raw 6-decimal amount
 * `11811649` as a whole number instead compact-formats to `11.81M`.
 */
const FRXUSD_DISPLAY_AMOUNT = `11.812 ${FRXUSD_SYMBOL}`;
const HYPEREVM_CLIENT_ID = 'hyperevm-local';
const HYPEREVM_CAIP_CHAIN_ID = 'eip155:999';
const HYPEREVM_NATIVE_ASSET_ID = 'eip155:999/slip44:2457';
const HYPEREVM_CHAIN_DECIMAL = 999;
const WRONG_GROUPED_AMOUNT = '11,811,649';
const WRONG_COMPACT_AMOUNT = '11.81M';

const selectedAccount = getSelectedAccountGroupAccounts(mockMetaMaskState)[0];
const selectedAccountId = selectedAccount.id;

function getHyperEvmFrxUsdState() {
  return {
    ...mockMetaMaskState,
    consentDecisionMade: true,
    optedIn: true,
    // Prevent the BIP-44 intro modal from mounting; its Lottie XHR to a
    // localhost asset is what logged AggregateError in jsdom.
    hasShownMultichainAccountsIntroModal: true,
    defaultHomeActiveTabName: AccountOverviewTabKey.Tokens,
    selectedNetworkClientId: HYPEREVM_CLIENT_ID,
    selectedMultichainNetworkChainId: HYPEREVM_CAIP_CHAIN_ID,
    isEvmSelected: true,
    enabledNetworkMap: {
      eip155: {
        [CHAIN_IDS.HYPE]: true,
      },
    },
    networkConfigurationsByChainId: {
      ...mockMetaMaskState.networkConfigurationsByChainId,
      [CHAIN_IDS.HYPE]: {
        chainId: CHAIN_IDS.HYPE,
        rpcEndpoints: [
          {
            networkClientId: HYPEREVM_CLIENT_ID,
            url: 'http://localhost:8545',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://hyperevmscan.io/'],
        defaultBlockExplorerUrlIndex: 0,
        name: HYPEREVM_DISPLAY_NAME,
        nativeCurrency: 'HYPE',
      },
    },
    networksMetadata: {
      ...mockMetaMaskState.networksMetadata,
      [HYPEREVM_CLIENT_ID]: {
        EIPS: {
          1559: true,
        },
        status: 'available',
      },
    },
    customAssets: {
      [selectedAccountId]: [FRXUSD_ASSET_ID],
    },
    assetsBalance: {
      [selectedAccountId]: {
        [HYPEREVM_NATIVE_ASSET_ID]: { amount: '25' },
        [FRXUSD_ASSET_ID]: { amount: FRXUSD_HUMAN_BALANCE },
      },
    },
    assetsInfo: {
      ...mockMetaMaskState.assetsInfo,
      [HYPEREVM_NATIVE_ASSET_ID]: {
        type: 'native',
        decimals: 18,
        symbol: 'HYPE',
        name: HYPEREVM_DISPLAY_NAME,
      },
      [FRXUSD_ASSET_ID]: {
        aggregators: ['Metamask'],
        decimals: FRXUSD_DECIMALS,
        image: `https://static.cx.metamask.io/api/v1/tokenIcons/${HYPEREVM_CHAIN_DECIMAL}/${FRXUSD_ADDRESS}.png`,
        name: FRXUSD_SYMBOL,
        symbol: FRXUSD_SYMBOL,
        type: 'erc20',
      },
    },
    allTokens: {
      ...mockMetaMaskState.allTokens,
      [CHAIN_IDS.HYPE]: {
        [selectedAccount.address]: [
          {
            address: FRXUSD_ADDRESS,
            symbol: FRXUSD_SYMBOL,
            decimals: FRXUSD_DECIMALS,
            name: FRXUSD_SYMBOL,
          },
        ],
      },
    },
    tokens: [
      {
        address: FRXUSD_ADDRESS,
        symbol: FRXUSD_SYMBOL,
        decimals: FRXUSD_DECIMALS,
        name: FRXUSD_SYMBOL,
      },
    ],
  };
}

function mockTokenDisplayHttp() {
  nock('https://price.api.cx.metamask.io')
    .persist()
    .get(/.*/u)
    .query(true)
    .reply(200, {});
  nock('https://static.cx.metamask.io').persist().get(/.*/u).reply(200, '');
  // Custom HyperEVM is not in CHAIN_ID_TO_CURRENCY_SYMBOL_MAP, so
  // useIsOriginalNativeTokenSymbol / useCurrencyRatePolling fetch this list.
  nock('https://chainid.network')
    .persist()
    .get('/chains.json')
    .reply(200, [
      {
        chainId: HYPEREVM_CHAIN_DECIMAL,
        name: HYPEREVM_DISPLAY_NAME,
        nativeCurrency: { symbol: 'HYPE' },
        rpc: ['http://localhost:8545'],
      },
    ]);
}

describe('HyperEVM frxUSD decimal formatting', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scroll', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    mockTokenDisplayHttp();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('formats 6-decimal frxUSD as 11.812 on the Tokens list and details', async () => {
    const accountName = getSelectedAccountGroupName(mockMetaMaskState);

    await act(async () => {
      await integrationTestRender({
        preloadedState: getHyperEvmFrxUsdState(),
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await screen.findByText(accountName);

    expect(
      screen.getByTestId('account-overview__asset-tab'),
    ).toBeInTheDocument();
    await clickElementById('account-overview__asset-tab');

    const listAmounts = await screen.findAllByTestId(
      'multichain-token-list-item-value',
    );
    expect(listAmounts.map((element) => element.textContent)).toContain(
      FRXUSD_DISPLAY_AMOUNT,
    );
    expect(screen.queryByText(WRONG_GROUPED_AMOUNT)).not.toBeInTheDocument();
    expect(screen.queryByText(WRONG_COMPACT_AMOUNT)).not.toBeInTheDocument();
    expect(screen.queryByText(/11\.81M/u)).not.toBeInTheDocument();

    const frxUsdRow = screen
      .getAllByTestId('multichain-token-list-button')
      .find((row) => row.textContent?.includes(FRXUSD_SYMBOL));
    expect(frxUsdRow).toBeDefined();

    await act(async () => {
      fireEvent.click(frxUsdRow as HTMLElement);
    });

    const details = await screen.findByTestId('parent-selector-asset-details');
    expect(
      within(details).getByTestId('multichain-token-list-item-value'),
    ).toHaveTextContent(FRXUSD_DISPLAY_AMOUNT);
    expect(screen.getByTestId('asset-token-decimals')).toHaveTextContent(
      String(FRXUSD_DECIMALS),
    );
  });
});
