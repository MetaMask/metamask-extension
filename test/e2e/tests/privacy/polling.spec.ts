import { strict as assert } from 'assert';
import { JsonRpcRequest } from '@metamask/utils';
import { MockedEndpoint } from 'mockttp';
import { expect } from '@playwright/test';
import FixtureBuilder from '../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { Mockttp } from '../../mock-e2e';
import HomePage from '../../page-objects/pages/homepage';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

const infuraMainnetUrl =
  'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const infuraSepoliaUrl =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';
const infuraLineaMainnetUrl =
  'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000';
const infuraLineaSepoliaUrl =
  'https://linea-sepolia.infura.io/v3/00000000000000000000000000000000';

const ethGetBlockByNumberResult = {
  statusCode: 200,
  json: {
    jsonrpc: '2.0',
    id: 367912711400466,
    result: {
      hash: '0x8f1697a1dfd439404fccc9ea370ab8ca4e1bb3465a6b74e5bf59891b909c5b86',
      parentHash:
        '0xc745f42de8dcb553511e5953b00220d2872c889261f606bbc6940600da3e24ad',
      sha3Uncles:
        '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      miner: '0x0000000000000000000000000000000000000000',
      stateRoot:
        '0x3e6f4a18a3d430fcb3748c89a32c98b7822c26ece58a28010c502af0247a5a05',
      transactionsRoot:
        '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
      receiptsRoot:
        '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
      logsBloom:
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      difficulty: '0x1',
      number: '0xd',
      gasLimit: '0x1c9c380',
      gasUsed: '0x0',
      timestamp: '0x67409c7e',
      extraData: '0x',
      mixHash:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      nonce: '0x0000000000000000',
      totalDifficulty: '0xe',
      size: '0x1fd',
      transactions: [],
      uncles: [],
    },
  },
};

async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  const blockNumber = { value: 0 };
  return [
    // Mocks for mainnet
    await mockServer
      .forPost(infuraMainnetUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6327576363628226',
          result: '0x1',
        },
      })),
    await mockServer
      .forPost(infuraMainnetUrl)
      .withBodyIncluding('eth_blockNumber')
      .thenCallback(() => {
        blockNumber.value += 1;
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 8723760595506777,
            result: blockNumber.value.toString(16),
          },
        };
      }),
    await mockServer
      .forPost(infuraMainnetUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return ethGetBlockByNumberResult;
      }),
    await mockServer
      .forPost(infuraMainnetUrl)
      .withBodyIncluding('eth_call')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '3aca99b4-92a1-4ad2-be3a-ae9fdd76fdaa',
            result:
              '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000004e2adedda15fd6',
          },
        };
      }),
    // Mocks for linea mainnet
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6327576363628226',
          result: '0x1',
        },
      })),
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withBodyIncluding('eth_blockNumber')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 8794509830454968,
            result: blockNumber.value.toString(16),
          },
        };
      }),
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return ethGetBlockByNumberResult;
      }),
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withBodyIncluding('eth_call')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '3aca99b4-92a1-4ad2-be3a-ae9fdd76fdaa',
            result:
              '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000004e2adedda15fd6',
          },
        };
      }),
    // Mocks for Sepolia
    await mockServer
      .forPost(infuraSepoliaUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6327576363628226',
          result: '0x1',
        },
      })),
    await mockServer
      .forPost(infuraSepoliaUrl)
      .withBodyIncluding('eth_blockNumber')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 8794509830454968,
            result: blockNumber.value.toString(16),
          },
        };
      }),
    await mockServer
      .forPost(infuraSepoliaUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return ethGetBlockByNumberResult;
      }),
    await mockServer
      .forPost(infuraSepoliaUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '367912711400467',
          result: '0x15af1d78b58c40000',
        },
      })),
    // Mocks for Linea Sepolia
    await mockServer
      .forPost(infuraLineaSepoliaUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6327576363628226',
          result: '0x1',
        },
      })),
    await mockServer
      .forPost(infuraLineaSepoliaUrl)
      .withBodyIncluding('eth_blockNumber')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 8794509830454968,
            result: blockNumber.value.toString(16),
          },
        };
      }),
    await mockServer
      .forPost(infuraLineaSepoliaUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return ethGetBlockByNumberResult;
      }),
    await mockServer
      .forPost(infuraLineaSepoliaUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '367912711400467',
          result: '0x15af1d78b58c40000',
        },
      })),
  ];
}
const DELAY_UNTIL_NEXT_POLL = 20000;
async function getAllInfuraJsonRpcRequests(
  mockedEndpoint: MockedEndpoint[],
): Promise<JsonRpcRequest[]> {
  const allInfuraJsonRpcRequests: JsonRpcRequest[] = [];
  let seenRequests;
  let seenProviderRequests;

  for (const m of mockedEndpoint) {
    seenRequests = await m.getSeenRequests();
    seenProviderRequests = seenRequests.filter((request) =>
      request.url.match('infura'),
    );

    for (const r of seenProviderRequests) {
      const json = (await r.body.getJson()) as JsonRpcRequest | undefined;
      if (json !== undefined) {
        allInfuraJsonRpcRequests.push(json);
      }
    }
  }

  return allInfuraJsonRpcRequests;
}
describe('Account Tracker API polling', function () {
  it('should make the expected RPC calls to infura', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint }) => {
        await loginWithoutBalanceValidation(driver);
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        // Want to wait long enough  to pull requests relevant to a single loop cycle
        await driver.delay(DELAY_UNTIL_NEXT_POLL);
        const infuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );

        // TODO: expecting the length of infuraJsonRpcRequests would be more accurate
        if (process.env.PORTFOLIO_VIEW) {
          const ethCallInfuraRequests = infuraJsonRpcRequests.filter(
            (obj) =>
              obj.method === 'eth_call' &&
              (obj.params as unknown[])?.[1] === '3',
          );

          const ethGetBalanceInfuraRequests = infuraJsonRpcRequests.filter(
            (obj) =>
              obj.method === 'eth_getBalance' &&
              (obj.params as unknown[])?.[1] === '3',
          );

          // We will call eth_getBalance for Sepolia and Linea Sepolia because multicall is not available for them
          expect(ethGetBalanceInfuraRequests.length).toEqual(2);
          // We will call eth_call for linea mainnet and mainnet
          expect(ethCallInfuraRequests.length).toEqual(2);
        } else {
          expect(
            infuraJsonRpcRequests.some(
              (obj) => obj.method === 'eth_blockNumber',
            ),
          ).toBeTruthy();
          expect(
            infuraJsonRpcRequests.some(
              (obj) => obj.method === 'eth_getBlockByNumber',
            ),
          ).toBeTruthy();
          expect(
            infuraJsonRpcRequests.some((obj) => obj.method === 'eth_call'),
          ).toBeTruthy();
        }
      },
    );
  });
});

describe('Token Detection', function () {
  async function mockAccountApiForPortfolioView(mockServer: Mockttp) {
    return [
      await mockServer
        .forGet(
          'https://accounts.api.cx.metamask.io/v2/accounts/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/balances',
        )
        .withQuery({
          networks: '1,59144',
        })
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            count: 0,
            balances: [
              {
                object: 'token',
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                name: 'Ether',
                type: 'native',
                timestamp: '2015-07-30T03:26:13.000Z',
                decimals: 18,
                chainId: 1,
                balance: '20',
              },
            ],
            unprocessedNetworks: [],
          },
        })),
    ];
  }
  it('should make calls to account api as expected', async function () {
    if (process.env.PORTFOLIO_VIEW) {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: mockAccountApiForPortfolioView,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await loginWithoutBalanceValidation(driver);
          const homepage = new HomePage(driver);
          await homepage.check_pageIsLoaded();
          await driver.delay(DELAY_UNTIL_NEXT_POLL);

          for (const single of mockedEndpoints) {
            const requests = await single.getSeenRequests();
            assert.equal(
              requests.length,
              1,
              `${single} should make requests after onboarding`,
            );
          }
        },
      );
    }
  });
});
