import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { MockedEndpoint, Mockttp } from '../../mock-e2e';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { Driver } from '../../webdriver/driver';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import { MOCK_META_METRICS_ID } from '../../constants';
import { mockDialogSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

export const DECODING_E2E_API_URL =
  'https://signature-insights.api.cx.metamask.io/v1';

export async function scrollAndConfirmAndAssertConfirm(driver: Driver) {
  const confirmation = new Confirmation(driver);
  await confirmation.clickScrollToBottomButton();
  await confirmation.clickFooterConfirmButton();
}

export function withTransactionEnvelopeTypeFixtures(
  // Default params first is discouraged because it makes it hard to call the function without the
  // optional parameters. But it doesn't apply here because we're always passing in a variable for
  // title. It's optional because it's sometimes unset.
  // eslint-disable-next-line @typescript-eslint/default-param-last
  title: string = '',
  transactionEnvelopeType: TransactionEnvelopeType,
  testFunction: Parameters<typeof withFixtures>[1],
  mocks?: (mockServer: Mockttp) => Promise<MockedEndpoint[]>, // Add mocks as an optional parameter
  smartContract?: typeof SMART_CONTRACTS,
) {
  const combinedMocks = async (
    mockServer: Mockttp,
  ): Promise<MockedEndpoint[]> => {
    const baseMocks = mocks ? await mocks(mockServer) : [];
    const dialogSnapMocks = await mockDialogSnap(mockServer);
    return [...baseMocks, ...[dialogSnapMocks]];
  };
  return withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      driverOptions: { timeOut: 20000 },
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withMetaMetricsController({
          metaMetricsId: MOCK_META_METRICS_ID,
          participateInMetaMetrics: true,
        })
        .build(),
      localNodeOptions:
        transactionEnvelopeType === TransactionEnvelopeType.legacy
          ? { hardfork: 'muirGlacier' }
          : {},
      ...(smartContract && { smartContract }),
      testSpecificMock: combinedMocks,
      title,
    },
    testFunction,
  );
}

export function withSignatureFixtures(
  // Default params first is discouraged because it makes it hard to call the function without the
  // optional parameters. But it doesn't apply here because we're always passing in a variable for
  // title. It's optional because it's sometimes unset.
  // eslint-disable-next-line @typescript-eslint/default-param-last
  title: string = '',
  testFunction: Parameters<typeof withFixtures>[1],
  mocks?: (mockServer: Mockttp) => Promise<MockedEndpoint[]>, // Add mocks as an optional parameter
) {
  return withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      driverOptions: { timeOut: 20000 },
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withMetaMetricsController({
          metaMetricsId: MOCK_META_METRICS_ID,
          participateInMetaMetrics: true,
        })
        .build(),
      localNodeOptions: {},
      testSpecificMock: mocks,
      title,
    },
    testFunction,
  );
}

async function createMockSegmentEvent(mockServer: Mockttp, eventName: string) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: eventName }],
    })
    .thenCallback(() => ({
      statusCode: 200,
    }));
}

async function createMockSignatureDecodingEvent(mockServer: Mockttp) {
  return await mockServer
    .forPost(`${DECODING_E2E_API_URL}/signature`)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        stateChanges: [
          {
            assetType: 'NATIVE',
            changeType: 'RECEIVE',
            address: '',
            amount: '900000000000000000',
            contractAddress: '',
          },
          {
            assetType: 'ERC721',
            changeType: 'LISTING',
            address: '',
            amount: '',
            contractAddress: '0xafd4896984CA60d2feF66136e57f958dCe9482d5',
            tokenID: '2101',
          },
        ],
      },
    }));
}

export async function mockSignatureApproved(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  const anonEvents = withAnonEvents
    ? [
        await createMockSegmentEvent(mockServer, 'Signature Requested Anon'),
        await createMockSegmentEvent(mockServer, 'Signature Approved Anon'),
      ]
    : [];

  return [
    await createMockSegmentEvent(mockServer, 'Signature Requested'),
    await createMockSegmentEvent(mockServer, 'Account Details Opened'),
    ...anonEvents,
    await createMockSegmentEvent(mockServer, 'Signature Approved'),
  ];
}

export async function mockSignatureApprovedWithDecoding(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  return [
    ...(await mockSignatureApproved(mockServer, withAnonEvents)),
    await createMockSignatureDecodingEvent(mockServer),
  ];
}

export async function mockSignatureRejected(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  const anonEvents = withAnonEvents
    ? [
        await createMockSegmentEvent(mockServer, 'Signature Requested Anon'),
        await createMockSegmentEvent(mockServer, 'Signature Rejected Anon'),
      ]
    : [];

  return [
    await createMockSegmentEvent(mockServer, 'Signature Requested'),
    await createMockSegmentEvent(mockServer, 'Signature Rejected'),
    ...anonEvents,
  ];
}

export async function mockSignatureRejectedWithDecoding(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  return [
    ...(await mockSignatureRejected(mockServer, withAnonEvents)),
    await createMockSignatureDecodingEvent(mockServer),
  ];
}

export async function mockPermitDecoding(mockServer: Mockttp) {
  return [await createMockSignatureDecodingEvent(mockServer)];
}

export async function mockedSourcifyTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    .withQuery({ hex_signature: '0xa9059cbb' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            bytes_signature: '©\u0005»',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            created_at: '2016-07-09T03:58:28.234977Z',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hex_signature: '0xa9059cbb',
            id: 145,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            text_signature: 'transfer(address,uint256)',
          },
        ],
      },
    }));
}

export async function mockEip7702FeatureFlag(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: [
            {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              confirmations_eip_7702: {
                contracts: {
                  '0xaa36a7': [
                    {
                      signature:
                        '0x016cf109489c415ba28e695eb3cb06ac46689c5c49e2aba101d7ec2f68c890282563b324f5c8df5e0536994451825aa235438b7346e8c18b4e64161d990781891c',
                      address: '0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454',
                    },
                  ],
                  '0x539': [
                    {
                      address: '0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f',
                      signature:
                        '0x4c15775d0c6d5bd37a7aa7aafc62e85597ea705024581b8b5cb0edccc4e6a69e26c495b3ae725815a377c9789bff43bf19e4dd1eaa679e65133e49ceee3ea87f1b',
                    },
                  ],
                  '0x1': [
                    {
                      address: '0xabcabcabcabcabcabcabcabcabcabcabcabcabca',
                      signature:
                        '0x5b394cc656b760fc15e855f9b8b9d0eec6337328361771c696d7f5754f0348e06298d34243e815ff8b5ce869e5f310c37dd100c1827e91b56bb208d1fafcf3a71c',
                    },
                  ],
                },
                supportedChains: ['0xaa36a7', '0x539', '0x1'],
              },
            },
          ],
        };
      }),
  ];
}
export async function mockDeFiPositionFeatureFlag(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        'https://defiadapters.api.cx.metamask.io/positions/0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      )
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: {
            data: [
              {
                protocolId: 'aave-v2',
                name: 'Aave v2 AToken',
                description: 'Aave v2 defi adapter for yield-generating token',
                siteUrl: 'https://aave.com/',
                iconUrl: '',
                positionType: 'supply',
                chainId: 1,
                productId: 'a-token',
                metadata: {
                  groupPositions: true,
                },
                protocolDisplayName: 'Aave V2',
                chainName: 'ethereum',
                success: true,
                tokens: [
                  {
                    address: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
                    name: 'Aave interest bearing USDT',
                    symbol: 'aUSDT',
                    decimals: 6,
                    balanceRaw: '300106',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                        name: 'Tether USD',
                        symbol: 'USDT',
                        decimals: 6,
                        type: 'underlying',
                        balanceRaw: '300106',
                        balance: 0.300106,
                        price: 0.99994,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                      },
                    ],
                    balance: 0.300106,
                  },
                  {
                    address: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
                    name: 'Aave interest bearing WETH',
                    symbol: 'aWETH',
                    decimals: 18,
                    balanceRaw: '20000539486338',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        type: 'underlying',
                        balanceRaw: '20000539486338',
                        balance: 0.000020000539486338,
                        price: 1599.45,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                      },
                    ],
                    balance: 0.000020000539486338,
                  },
                ],
              },
              {
                protocolId: 'aave-v3',
                name: 'Aave v3 AToken',
                description: 'Aave v3 defi adapter for yield-generating token',
                siteUrl: 'https://aave.com/',
                iconUrl: '',
                positionType: 'supply',
                chainId: 1,
                productId: 'a-token',
                metadata: {
                  groupPositions: true,
                },
                protocolDisplayName: 'Aave V3',
                chainName: 'ethereum',
                success: true,
                tokens: [
                  {
                    address: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',
                    name: 'Aave Ethereum USDT',
                    symbol: 'aEthUSDT',
                    decimals: 6,
                    balanceRaw: '300112',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                        name: 'Tether USD',
                        symbol: 'USDT',
                        decimals: 6,
                        type: 'underlying',
                        balanceRaw: '300112',
                        balance: 0.300112,
                        price: 0.99994,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                      },
                    ],
                    balance: 0.300112,
                  },
                  {
                    address: '0xfA1fDbBD71B0aA16162D76914d69cD8CB3Ef92da',
                    name: 'Aave Ethereum Lido WETH',
                    symbol: 'aEthLidoWETH',
                    decimals: 18,
                    balanceRaw: '9030902767263172',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        type: 'underlying',
                        balanceRaw: '9030902767263172',
                        balance: 0.00903090276726317,
                        price: 1599.45,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                      },
                    ],
                    balance: 0.00903090276726317,
                  },
                ],
              },
              {
                protocolId: 'uniswap-v2',
                name: 'UniswapV2',
                description: 'UniswapV2 pool adapter',
                siteUrl: 'https://v2.info.uniswap.org/home',
                iconUrl: '',
                positionType: 'supply',
                chainId: 59144,
                productId: 'pool',
                protocolDisplayName: 'UniswapV2',
                chainName: 'arb',
                success: true,
                tokens: [
                  {
                    address: '0xF64Dfe17C8b87F012FCf50FbDA1D62bfA148366a',
                    name: 'Uniswap V2 WETH / USDC',
                    symbol: 'UNI-V2/WETH/USDC',
                    decimals: 18,
                    balanceRaw: '42930233173',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        type: 'underlying',
                        balanceRaw: '1328682329199896',
                        balance: 0.0013286823291999,
                        price: 1596.15,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png',
                      },
                      {
                        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6,
                        type: 'underlying',
                        balanceRaw: '2121732',
                        balance: 2.121732,
                        price: 0.999931,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png',
                      },
                    ],
                    balance: 4.2930233173e-8,
                  },
                ],
              },
              {
                protocolId: 'uniswap-v3',
                name: 'UniswapV3',
                description: 'UniswapV3 defi adapter',
                siteUrl: 'https://uniswap.org/',
                iconUrl:
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
                positionType: 'supply',
                chainId: 59144,
                productId: 'pool',
                protocolDisplayName: 'UniswapV3',
                chainName: 'arb',
                success: true,
                tokens: [
                  {
                    address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                    tokenId: '4198285',
                    name: 'WETH / USDC - 0.05%',
                    symbol: 'WETH / USDC - 0.05%',
                    decimals: 18,
                    balanceRaw: '51819988773',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        balanceRaw: '1297885712689618',
                        type: 'underlying',
                        balance: 0.00129788571268962,
                        price: 1596.15,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png',
                      },
                      {
                        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        balanceRaw: '59946788255878',
                        type: 'underlying-claimable',
                        balance: 0.000059946788255878,
                        price: 1596.15,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png',
                      },
                      {
                        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6,
                        balanceRaw: '2068988',
                        type: 'underlying',
                        balance: 2.068988,
                        price: 0.999931,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png',
                      },
                      {
                        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6,
                        balanceRaw: '39876',
                        type: 'underlying-claimable',
                        balance: 0.039876,
                        price: 0.999931,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png',
                      },
                    ],
                    balance: 5.1819988773e-8,
                  },
                  {
                    address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                    tokenId: '4218057',
                    name: 'WETH / USDC - 0.01%',
                    symbol: 'WETH / USDC - 0.01%',
                    decimals: 18,
                    balanceRaw: '52094479394',
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        balanceRaw: '1304830266255102',
                        type: 'underlying',
                        balance: 0.0013048302662551,
                        price: 1596.15,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png',
                      },
                      {
                        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
                        name: 'Wrapped Ether',
                        symbol: 'WETH',
                        decimals: 18,
                        balanceRaw: '12367250795581',
                        type: 'underlying-claimable',
                        balance: 0.000012367250795581,
                        price: 1596.15,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png',
                      },
                      {
                        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6,
                        balanceRaw: '2079837',
                        type: 'underlying',
                        balance: 2.079837,
                        price: 0.999931,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png',
                      },
                      {
                        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6,
                        balanceRaw: '25065',
                        type: 'underlying-claimable',
                        balance: 0.025065,
                        price: 0.999931,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png',
                      },
                    ],
                    balance: 5.2094479394e-8,
                  },
                ],
              },
            ],
          },
        };
      }),
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: [
            {
              assetsDefiPositionsEnabled: true,
            },
            {
              sendRedesign: {
                enabled: false,
              },
            },
          ],
        };
      }),
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            '0x0000000000000000000000000000000000000000': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          },
        };
      }),
  ];
}
export async function mockNoDeFiPositionFeatureFlag(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        'https://defiadapters.api.cx.metamask.io/positions/0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      )
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: { data: [] },
        };
      }),
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: [
            {
              assetsDefiPositionsEnabled: true,
            },
            {
              sendRedesign: {
                enabled: false,
              },
            },
          ],
        };
      }),
  ];
}

export async function mockDefiPositionsFailure(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        'https://defiadapters.api.cx.metamask.io/positions/0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      )
      .thenCallback(() => {
        return {
          ok: false,
          statusCode: 500,
        };
      }),
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: [
            {
              assetsDefiPositionsEnabled: true,
            },
          ],
        };
      }),
  ];
}
