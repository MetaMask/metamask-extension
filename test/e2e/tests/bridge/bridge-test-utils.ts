import { Mockttp } from 'mockttp';

import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { BRIDGE_CLIENT_ID } from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import type { FeatureFlagResponse } from '../../../../shared/types/bridge';
import {
  DEFAULT_FEATURE_FLAGS_RESPONSE,
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
} from './constants';

export class BridgePage {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  reloadHome = async () => {
    await this.driver.navigate();
  };

  navigateToBridgePage = async (
    location:
      | 'wallet-overview'
      | 'coin-overview'
      | 'token-overview' = 'wallet-overview',
  ) => {
    // Mitigates flakiness by waiting for the feature flags to be fetched
    await this.driver.delay(3000);
    let bridgeButtonTestIdPrefix;
    switch (location) {
      case 'wallet-overview':
        bridgeButtonTestIdPrefix = 'eth';
        break;
      case 'coin-overview': // native asset page
        bridgeButtonTestIdPrefix = 'coin';
        break;
      case 'token-overview':
      default:
        bridgeButtonTestIdPrefix = 'token';
    }
    await this.driver.clickElement(
      `[data-testid="${bridgeButtonTestIdPrefix}-overview-bridge"]`,
    );
  };

  navigateToAssetPage = async (symbol: string) => {
    await this.driver.clickElement({
      css: '[data-testid="multichain-token-list-button"]',
      text: symbol,
    });
    await this.driver.waitForUrlContaining({
      url: 'asset',
    });
  };

  verifyPortfolioTab = async () => {
    await this.driver.switchToWindowWithTitle('E2E Test Page');
    await this.driver.waitForUrlContaining({
      url: 'portfolio.metamask.io/bridge',
    });
  };

  verifySwapPage = async () => {
    await this.driver.waitForUrlContaining({
      url: 'cross-chain/swaps',
    });
  };
}

async function mockFeatureFlag(
  mockServer: Mockttp,
  featureFlagOverrides: Partial<FeatureFlagResponse>,
) {
  return await mockServer
    .forGet(/getAllFeatureFlags/u)
    .withHeaders({ 'X-Client-Id': BRIDGE_CLIENT_ID })
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          ...DEFAULT_FEATURE_FLAGS_RESPONSE,
          ...featureFlagOverrides,
          'extension-config': {
            ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
            ...featureFlagOverrides['extension-config'],
          },
        },
      };
    });
}

async function mockPortfolioPage(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://portfolio.metamask.io/bridge`)
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage(),
      };
    });
}

async function mockGetTxStatus(mockServer: Mockttp) {
  return await mockServer.forGet(/getTxStatus/u).thenCallback(async (req) => {
    const urlObj = new URL(req.url);
    const txHash = urlObj.searchParams.get('srcTxHash');
    const srcChainId = urlObj.searchParams.get('srcChainId');
    const destChainId = urlObj.searchParams.get('destChainId');
    return {
      statusCode: 200,
      json: {
        status: 'COMPLETE',
        isExpectedToken: true,
        bridge: 'across',
        srcChain: {
          chainId: srcChainId,
          txHash,
        },
        destChain: {
          chainId: destChainId,
          txHash,
        },
      },
    };
  });
}

async function mockLineaTokens(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://bridge.dev-api.cx.metamask.io/getTokens`)
    .withQuery({ chainId: 59144 })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            assetId: 'eip155:59144/slip44:60',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ether',
            coingeckoId: 'ethereum',
            aggregators: [],
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/native/60.png',
            metadata: {
              honeypotStatus: {},
              erc20Permit: false,
              description: {
                en: 'Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.On Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.',
                ko: '이더리움(Ethereum/ETH)은 블록체인 기술에 기반한 클라우드 컴퓨팅 플랫폼 또는 프로그래밍 언어이다. 비탈릭 부테린이 개발하였다.비탈릭 부테린은 가상화폐인 비트코인에 사용된 핵심 기술인 블록체인(blockchain)에 화폐 거래 기록뿐 아니라 계약서 등의 추가 정보를 기록할 수 있다는 점에 착안하여, 전 세계 수많은 사용자들이 보유하고 있는 컴퓨팅 자원을 활용해 분산 네트워크를 구성하고, 이 플랫폼을 이용하여 SNS, 이메일, 전자투표 등 다양한 정보를 기록하는 시스템을 창안했다. 이더리움은 C++, 자바, 파이썬, GO 등 주요 프로그래밍 언어를 지원한다.이더리움을 사물 인터넷(IoT)에 적용하면 기계 간 금융 거래도 가능해진다. 예를 들어 고장난 청소로봇이 정비로봇에 돈을 내고 정비를 받고, 청소로봇은 돈을 벌기 위해 정비로봇의 집을 청소하는 것도 가능해진다.',
                zh: 'Ethereum（以太坊）是一个平台和一种编程语言，使开发人员能够建立和发布下一代分布式应用。Ethereum 是使用甲醚作为燃料，以激励其网络的第一个图灵完备cryptocurrency。Ethereum（以太坊） 是由Vitalik Buterin的创建。该项目于2014年8月获得了美国1800万$比特币的价值及其crowdsale期间。在2016年，Ethereum（以太坊）的价格上涨超过50倍。',
                ja: 'イーサリアム (Ethereum, ETH)・プロジェクトにより開発が進められている、分散型アプリケーション（DApps）やスマート・コントラクトを構築するためのプラットフォームの名称、及び関連するオープンソース・ソフトウェア・プロジェクトの総称である。イーサリアムでは、イーサリアム・ネットワークと呼ばれるP2Pのネットワーク上でスマート・コントラクトの履行履歴をブロックチェーンに記録していく。またイーサリアムは、スマート・コントラクトを記述するチューリング完全なプログラミング言語を持ち、ネットワーク参加者はこのネットワーク上のブロックチェーンに任意のDAppsやスマート・コントラクトを記述しそれを実行することが可能になる。ネットワーク参加者が「Ether」と呼ばれるイーサリアム内部通貨の報酬を目当てに、採掘と呼ばれるブロックチェーンへのスマート・コントラクトの履行結果の記録を行うことで、その正統性を保証していく。このような仕組みにより特定の中央管理組織に依拠せず、P2P全体を実行環境としてプログラムの実行とその結果を共有することが可能になった。',
              },
              createdAt: '2023-10-31T21:55:26.652Z',
            },
            chainId: 59144,
          },
          {
            address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
            assetId:
              'eip155:59144/erc20:0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
            symbol: 'WETH',
            decimals: 18,
            name: 'Wrapped Ether',
            coingeckoId: 'wrapped-ether-linea',
            aggregators: [
              'lineaTeam',
              'coinGecko',
              'oneInch',
              'liFi',
              'xSwap',
              'socket',
              'rubic',
              'squid',
            ],
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/erc20/0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f.png',
            metadata: {
              honeypotStatus: {
                goPlus: false,
              },
              isContractVerified: true,
              storage: {
                balance: 3,
                approval: 4,
              },
              erc20Permit: false,
              createdAt: '2023-10-31T21:55:26.652Z',
            },
            chainId: 59144,
          },
          {
            address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
            assetId:
              'eip155:59144/erc20:0xa219439258ca9da29e9cc4ce5596924745e12b93',
            symbol: 'USDT',
            decimals: 6,
            name: 'Tether USD',
            coingeckoId: 'bridged-tether-linea',
            aggregators: [
              'lineaTeam',
              'coinGecko',
              'oneInch',
              'liFi',
              'xSwap',
              'rubic',
              'squid',
            ],
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/59144/erc20/0xa219439258ca9da29e9cc4ce5596924745e12b93.png',
            metadata: {
              honeypotStatus: {
                goPlus: false,
              },
              isContractVerified: true,
              storage: {
                balance: 51,
                approval: 52,
              },
              erc20Permit: false,
              createdAt: '2023-10-31T21:55:26.652Z',
            },
            chainId: 59144,
          },
        ],
      };
    });
}

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
  withErc20: boolean = true,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState()
    .withTokensController({
      allTokens: {
        '0x1': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              symbol: 'DAI',
              decimals: 18,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
    });

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  }

  return {
    fixtures: fixtureBuilder.build(),
    testSpecificMock: async (mockServer: Mockttp) => [
      await mockFeatureFlag(mockServer, featureFlags),
      await mockGetTxStatus(mockServer),
      await mockLineaTokens(mockServer),
      await mockPortfolioPage(mockServer),
    ],
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    smartContract: SMART_CONTRACTS.HST,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          loadState: './test/e2e/seeder/network-states/with50Dai.json',
        },
      },
    ],
    title,
  };
};
