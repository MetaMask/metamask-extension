import type { CaipAssetType, Hex } from '@metamask/utils';
import { act, cleanup, screen, within } from '@testing-library/react';
import nock from 'nock';
import { AccountOverviewTabKey } from '../../../shared/constants/app-state';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  XDC_DISPLAY_NAME,
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

const XDC_CLIENT_ID = 'xdc-local';
const MAINNET_CLIENT_ID = 'testNetworkConfigurationId';
const XDC_CAIP_CHAIN_ID = 'eip155:50';
const MAINNET_CAIP_CHAIN_ID = 'eip155:1';
const XDC_NATIVE_ASSET_ID = 'eip155:50/slip44:60' as CaipAssetType;
const MAINNET_NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const SEEDED_ERC20_SYMBOL = 'TST';
const SEEDED_ERC20_ADDRESS = '0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947';
const SEEDED_ERC20_ASSET_ID =
  `eip155:50/erc20:${SEEDED_ERC20_ADDRESS}` as CaipAssetType;
const XDC_SYMBOL = CURRENCY_SYMBOLS.XDC;
const NATIVE_BALANCE = '25';
const ERC20_BALANCE = '10';

const selectedAccount = getSelectedAccountGroupAccounts(mockMetaMaskState)[0];
const selectedAccountId = selectedAccount.id;

type SelectedNetwork = 'xdc' | 'mainnet';

function buildState(selected: SelectedNetwork) {
  const isXdc = selected === 'xdc';
  const selectedChainId: Hex = isXdc ? CHAIN_IDS.XDC : CHAIN_IDS.MAINNET;
  const selectedClientId = isXdc ? XDC_CLIENT_ID : MAINNET_CLIENT_ID;
  const selectedCaipChainId = isXdc ? XDC_CAIP_CHAIN_ID : MAINNET_CAIP_CHAIN_ID;

  return {
    ...mockMetaMaskState,
    consentDecisionMade: true,
    optedIn: true,
    // Prevent the BIP-44 intro modal from mounting; its Lottie XHR to a
    // localhost asset is what logged AggregateError in jsdom.
    hasShownMultichainAccountsIntroModal: true,
    defaultHomeActiveTabName: AccountOverviewTabKey.Tokens,
    selectedNetworkClientId: selectedClientId,
    selectedMultichainNetworkChainId: selectedCaipChainId,
    isEvmSelected: true,
    preferences: {
      ...mockMetaMaskState.preferences,
      tokenNetworkFilter: {
        [selectedChainId]: true,
      },
    },
    // Filter to the selected chain only (same pattern as NFT/DeFi
    // integration suites). Both chains' balances remain seeded in
    // assetsBalance so switching back can still render XDC amounts.
    enabledNetworkMap: {
      eip155: {
        [selectedChainId]: true,
      },
    },
    networkConfigurationsByChainId: {
      ...mockMetaMaskState.networkConfigurationsByChainId,
      [CHAIN_IDS.XDC]: {
        chainId: CHAIN_IDS.XDC,
        rpcEndpoints: [
          {
            networkClientId: XDC_CLIENT_ID,
            url: 'http://localhost:8545',
            type: 'custom',
            name: XDC_DISPLAY_NAME,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://xdcscan.io'],
        defaultBlockExplorerUrlIndex: 0,
        name: XDC_DISPLAY_NAME,
        nativeCurrency: XDC_SYMBOL,
      },
    },
    networksMetadata: {
      ...mockMetaMaskState.networksMetadata,
      [XDC_CLIENT_ID]: {
        EIPS: {
          1559: true,
        },
        status: 'available',
      },
    },
    customAssets: {
      [selectedAccountId]: [SEEDED_ERC20_ASSET_ID],
    },
    // Seed both networks' balances once; only the selected filter changes.
    // This models WPN-1795 #4: balances must still render after a Mainnet
    // round-trip when AssetsController still holds the XDC amounts.
    assetsBalance: {
      [selectedAccountId]: {
        [XDC_NATIVE_ASSET_ID]: { amount: NATIVE_BALANCE },
        [SEEDED_ERC20_ASSET_ID]: { amount: ERC20_BALANCE },
        [MAINNET_NATIVE_ASSET_ID]: { amount: NATIVE_BALANCE },
      },
    },
    assetsInfo: {
      ...mockMetaMaskState.assetsInfo,
      [XDC_NATIVE_ASSET_ID]: {
        type: 'native',
        decimals: 18,
        symbol: XDC_SYMBOL,
        name: XDC_DISPLAY_NAME,
      },
      [SEEDED_ERC20_ASSET_ID]: {
        aggregators: ['Metamask', 'Aave'],
        decimals: 4,
        image: `https://static.cx.metamask.io/api/v1/tokenIcons/50/${SEEDED_ERC20_ADDRESS}.png`,
        name: SEEDED_ERC20_SYMBOL,
        symbol: SEEDED_ERC20_SYMBOL,
        type: 'erc20',
      },
      [MAINNET_NATIVE_ASSET_ID]: {
        type: 'native',
        decimals: 18,
        symbol: 'ETH',
        name: 'Ethereum',
      },
    },
    allTokens: {
      ...mockMetaMaskState.allTokens,
      [CHAIN_IDS.XDC]: {
        [selectedAccount.address]: [
          {
            address: SEEDED_ERC20_ADDRESS,
            symbol: SEEDED_ERC20_SYMBOL,
            decimals: 4,
            name: SEEDED_ERC20_SYMBOL,
          },
        ],
      },
    },
    tokens: isXdc
      ? [
          {
            address: SEEDED_ERC20_ADDRESS,
            symbol: SEEDED_ERC20_SYMBOL,
            decimals: 4,
            name: SEEDED_ERC20_SYMBOL,
          },
        ]
      : [],
  };
}

function mockTokenDisplayHttp() {
  nock('https://price.api.cx.metamask.io')
    .persist()
    .get(/.*/u)
    .query(true)
    .reply(200, {});
  nock('https://static.cx.metamask.io').persist().get(/.*/u).reply(200, '');
  nock('https://chainid.network')
    .persist()
    .get('/chains.json')
    .reply(200, [
      {
        chainId: 50,
        name: XDC_DISPLAY_NAME,
        nativeCurrency: { symbol: XDC_SYMBOL },
        rpc: ['http://localhost:8545'],
      },
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH' },
        rpc: ['https://testrpc.com'],
      },
    ]);
}

async function renderTokensHome(selected: SelectedNetwork) {
  await act(async () => {
    await integrationTestRender({
      preloadedState: buildState(selected),
      backgroundConnection: backgroundConnectionMocked,
    });
  });

  await screen.findByText(getSelectedAccountGroupName(mockMetaMaskState));
  expect(screen.getByTestId('account-overview__asset-tab')).toBeInTheDocument();
  await clickElementById('account-overview__asset-tab');
}

async function expectTokenAmount(symbol: string, amount: string) {
  const rows = await screen.findAllByTestId('multichain-token-list-button');
  const row = rows.find((candidate) => candidate.textContent?.includes(symbol));
  expect(row).toBeDefined();
  expect(
    within(row as HTMLElement).getByTestId('multichain-token-list-item-value'),
  ).toHaveTextContent(`${amount} ${symbol}`);
}

function expectTokenAbsent(symbol: string) {
  const amounts = screen
    .queryAllByTestId('multichain-token-list-item-value')
    .map((element) => element.textContent ?? '');
  expect(amounts.some((text) => text.includes(symbol))).toBe(false);
}

describe('XDC balance persistence across network selection', () => {
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

  it('hides XDC assets when Mainnet is selected', async () => {
    await renderTokensHome('mainnet');

    const rows = await screen.findAllByTestId('multichain-token-list-button');
    const hasEthRow = rows.some(
      (row) =>
        row.textContent?.includes('ETH') ||
        row.textContent?.includes('Ethereum'),
    );
    expect(hasEthRow).toBe(true);
    expectTokenAbsent(XDC_SYMBOL);
    expectTokenAbsent(SEEDED_ERC20_SYMBOL);
  });

  it('still shows seeded XDC balances after a Mainnet round-trip selection', async () => {
    await renderTokensHome('mainnet');
    expectTokenAbsent(XDC_SYMBOL);

    // Remount with the same seeded balances and XDC selected again — models
    // switching back after Mainnet without balances resetting in state.
    // This is UI↔state wiring, not AssetsController persistence / WPN-1795 #4 E2E.
    cleanup();
    await renderTokensHome('xdc');

    await expectTokenAmount(XDC_SYMBOL, NATIVE_BALANCE);
    await expectTokenAmount(SEEDED_ERC20_SYMBOL, ERC20_BALANCE);
  });
});
