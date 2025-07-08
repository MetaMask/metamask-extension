import { act, screen, waitFor } from '@testing-library/react';
import nock from 'nock';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { integrationTestRender } from '../../lib/render-helpers';
import mockMetaMaskState from '../data/integration-init-state.json';
import {
  clickElementById,
  clickElementByText,
  createMockImplementation,
  waitForElementByText,
  waitForElementByTextToNotBePresent,
} from '../helpers';

jest.setTimeout(20_000);

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...(mockRequests ?? {}),
    }),
  );
};

const account =
  mockMetaMaskState.internalAccounts.accounts[
    mockMetaMaskState.internalAccounts
      .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
  ];

const accountName = account.metadata.name;

const withMetamaskConnectedToMainnet = {
  ...mockMetaMaskState,
  participateInMetaMetrics: true,
  dataCollectionForMarketing: false,
  selectedNetworkClientId: 'testNetworkConfigurationId',
  preferences: {
    ...mockMetaMaskState.preferences,
    tokenNetworkFilter: {
      '0x1': true,
      '0x89': true,
      '0xaa36a7': true,
      '0xe705': true,
      '0xe708': true,
    },
  },
  enabledNetworkMap: {
    eip155: {
      '0x1': true,
      '0x89': true,
      '0xaa36a7': true,
      '0xe705': true,
      '0xe708': true,
    },
  },
  remoteFeatureFlags: {
    assetsDefiPositionsEnabled: true,
  },
  allDeFiPositions: {
    [account.address]: {
      '0x1': {
        aggregatedMarketValue: 11173.05, // 4650.38 (Aave) + 6522.67 (Lido)
        protocols: {
          'aave-v3': {
            protocolDetails: {
              name: 'AaveV3 Mainnet',
              iconUrl: '',
            },
            aggregatedMarketValue: 4650.38,
            positionTypes: {
              supply: {
                aggregatedMarketValue: 4650.38,
                positions: [
                  [
                    {
                      address: '0x3a3A65aAb0dd2A17E3F1947bA16138cd37d08c04',
                      name: 'Aave Ethereum WETH',
                      symbol: 'WETH',
                      decimals: 18,
                      balanceRaw: '1500000000000000000',
                      type: 'protocol',
                      tokens: [
                        {
                          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                          name: 'Wrapped Ether',
                          symbol: 'WETH',
                          decimals: 18,
                          type: 'underlying',
                          balanceRaw: '1500000000000000000',
                          balance: 1.5,
                          price: 3100.25,
                          iconUrl:
                            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                          marketValue: 4650.38,
                        },
                      ],
                      balance: 1.5,
                      marketValue: 4650.38,
                    },
                  ],
                ],
              },
              borrow: {
                aggregatedMarketValue: 1050.0,
                positions: [
                  [
                    {
                      address: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
                      name: 'Aave Ethereum USDC Debt',
                      symbol: 'USDC',
                      decimals: 6,
                      balanceRaw: '1050000000',
                      type: 'protocol',
                      tokens: [
                        {
                          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48',
                          name: 'USD Coin',
                          symbol: 'USDC',
                          decimals: 6,
                          type: 'underlying',
                          balanceRaw: '1050000000',
                          balance: 1050.0,
                          price: 1.0,
                          iconUrl:
                            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48/logo.png',
                          marketValue: 1050.0,
                        },
                      ],
                      balance: 1050.0,
                      marketValue: 1050.0,
                    },
                  ],
                ],
              },
            },
          },
          'metamask-staking': {
            protocolDetails: {
              name: 'MetaMask Staking',
              iconUrl:
                'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
            },
            aggregatedMarketValue: 6522.67,
            positionTypes: {
              stake: {
                aggregatedMarketValue: 6522.67,
                positions: [
                  [
                    {
                      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                      name: 'MetaMask Staked ETH',
                      symbol: 'mETH',
                      decimals: 18,
                      balanceRaw: '2102670000000000000',
                      type: 'protocol',
                      tokens: [
                        {
                          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                          name: 'Wrapped Ether',
                          symbol: 'WETH',
                          decimals: 18,
                          type: 'underlying',
                          balanceRaw: '2102670000000000000',
                          balance: 2.10267,
                          price: 3101.75,
                          iconUrl:
                            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                          marketValue: 6522.67,
                        },
                      ],
                      balance: 2.10267,
                      marketValue: 6522.67,
                    },
                  ],
                ],
              },
            },
          },
        },
      },
      '0x89': {
        aggregatedMarketValue: 0.0009252860881990987,
        protocols: {
          'aave-v3': {
            protocolDetails: {
              name: 'AaveV3 Polygon',
              iconUrl: '',
            },
            aggregatedMarketValue: 0.0009252860881990987,
            positionTypes: {
              supply: {
                aggregatedMarketValue: 0.0009254711821990989,
                positions: [
                  [
                    {
                      address: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
                      name: 'Aave Polygon WMATIC',
                      symbol: 'aPolWMATIC',
                      decimals: 18,
                      balanceRaw: '5000006387020102',
                      type: 'protocol',
                      tokens: [
                        {
                          address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                          name: 'Wrapped Polygon Ecosystem Token',
                          symbol: 'WPOL',
                          decimals: 18,
                          type: 'underlying',
                          balanceRaw: '5000006387020102',
                          balance: 0.005000006387020102,
                          price: 0.185094,
                          iconUrl:
                            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/logo.png',
                          marketValue: 0.0009254711821990989,
                        },
                      ],
                      balance: 0.005000006387020102,
                      marketValue: 0.0009254711821990989,
                    },
                  ],
                ],
              },
            },
          },
        },
      },
    },
  },
};

const isGlobalNetworkSelectorRemoved = process.env.REMOVE_GNS === 'true';

describe('Defi positions list', () => {
  beforeEach(() => {
    process.env.PORTFOLIO_VIEW = 'true';
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('displays the defi positions list for popular networks', async () => {
    await act(async () => {
      await integrationTestRender({
        preloadedState: withMetamaskConnectedToMainnet,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await screen.findByText(accountName);

    await clickElementById('account-overview__defi-tab');
    await waitForElementByText('AaveV3 Mainnet');
    await waitForElementByText('MetaMask Staking');
    await waitForElementByText('AaveV3 Polygon');
  });

  it('filters the defi positions list for the current network', async () => {
    const mockedMetaMaskState = {
      ...withMetamaskConnectedToMainnet,
      preferences: {
        ...withMetamaskConnectedToMainnet.preferences,
        tokenNetworkFilter: {
          '0x1': true,
        },
      },
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
        },
      },
    };
    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await screen.findByText(accountName);

    await clickElementById('account-overview__defi-tab');
    if (!isGlobalNetworkSelectorRemoved) {
      await clickElementById('sort-by-networks');
      await clickElementById('network-filter-current__button');
    }
    await waitForElementByText('AaveV3 Mainnet');
    await waitForElementByText('MetaMask Staking');
    await waitForElementByTextToNotBePresent('AaveV3 Polygon');
  });

  it('displays the defi positions details', async () => {
    await act(async () => {
      await integrationTestRender({
        preloadedState: withMetamaskConnectedToMainnet,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await clickElementById('account-overview__defi-tab');

    await waitForElementByText('AaveV3 Mainnet');
    await clickElementByText('AaveV3 Mainnet');

    const title = screen.getByTestId('defi-details-page-title');
    expect(title).toHaveTextContent('AaveV3 Mainnet');

    const marketValue = screen.getByTestId('defi-details-page-market-value');
    expect(marketValue).toHaveTextContent('$4,650.38');

    const supplyPosition = screen.getByTestId(
      'defi-details-list-supply-position',
    );
    expect(supplyPosition).toHaveTextContent('Supplied');
    expect(supplyPosition.parentElement).toHaveTextContent('Wrapped Ether');
    expect(supplyPosition.parentElement).toHaveTextContent('1.5 Wrapped Ether');
    expect(supplyPosition.parentElement).toHaveTextContent('$4,650.38');

    const borrowPosition = screen.getByTestId(
      'defi-details-list-borrow-position',
    );
    expect(borrowPosition).toHaveTextContent('Borrowed');
    expect(borrowPosition.parentElement).toHaveTextContent('USD Coin');
    expect(borrowPosition.parentElement).toHaveTextContent('1,050 USD Coin');
    expect(borrowPosition.parentElement).toHaveTextContent('$1,050.00');

    await clickElementById('defi-details-page-back-button');
    await clickElementById('account-overview__defi-tab');
    await waitForElementByText('MetaMask Staking');
    await clickElementByText('MetaMask Staking');

    const titleStaking = screen.getByTestId('defi-details-page-title');
    expect(titleStaking).toHaveTextContent('MetaMask Staking');

    const marketValueStaking = screen.getByTestId(
      'defi-details-page-market-value',
    );
    expect(marketValueStaking).toHaveTextContent('$6,522.67');

    const stakingPosition = screen.getByTestId(
      'defi-details-list-stake-position',
    );
    expect(stakingPosition).toHaveTextContent('Staked');
    expect(stakingPosition.parentElement).toHaveTextContent('Wrapped Ether');
    expect(stakingPosition.parentElement).toHaveTextContent(
      '2.10267 Wrapped Ether',
    );
    expect(stakingPosition.parentElement).toHaveTextContent('$6,522.67');

    let metricsEvents;

    await waitFor(() => {
      metricsEvents =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.filter(
          (call) =>
            call[0] === 'trackMetaMetricsEvent' &&
            (call[1] as unknown as Record<string, unknown>[])[0]?.event ===
              MetaMetricsEventName.DeFiDetailsOpened,
        );

      console.log(JSON.stringify(metricsEvents));
      expect(metricsEvents).toHaveLength(2);
    });

    const aaveEvent = metricsEvents?.[0]?.[1]?.[0] as unknown as Record<
      string,
      unknown
    >;
    const stakingEvent = metricsEvents?.[1]?.[1]?.[0] as unknown as Record<
      string,
      unknown
    >;

    expect(aaveEvent).toMatchObject({
      category: MetaMetricsEventCategory.DeFi,
      event: MetaMetricsEventName.DeFiDetailsOpened,
      properties: {
        location: 'Home',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: '0x1',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        protocol_id: 'aave-v3',
      },
      environmentType: 'background',
      page: {
        path: '/',
        title: 'Home',
        url: '/',
      },
    });

    expect(stakingEvent).toMatchObject({
      category: MetaMetricsEventCategory.DeFi,
      event: MetaMetricsEventName.DeFiDetailsOpened,
      properties: {
        location: 'Home',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: '0x1',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        protocol_id: 'metamask-staking',
      },
      environmentType: 'background',
      page: {
        path: '/',
        title: 'Home',
        url: '/',
      },
    });
  });
});
