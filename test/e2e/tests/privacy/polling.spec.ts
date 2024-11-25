import { JsonRpcRequest } from '@metamask/utils';
import { MockedEndpoint } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { Mockttp } from '../../mock-e2e';
import HomePage from '../../page-objects/pages/homepage';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { expect } from '@playwright/test';

const infuraMainnetUrl =
  'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const infuraSepoliaUrl =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';
const infuraLineaMainnetUrl =
  'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000';
const infuraLineaSepoliaUrl =
  'https://linea-sepolia.infura.io/v3/00000000000000000000000000000000';

async function mockInfura(mockServer: Mockttp): Promise<MockedEndpoint[]> {
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
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: 8723760595506777,
            result: '0xe',
          },
        };
      }),
      await mockServer
        .forPost(infuraMainnetUrl)
        .withBodyIncluding('eth_getBlockByNumber')
        .thenCallback(() => {
          return {
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
              result: '0x14476de',
            },
          };
        }),
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return {
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
            result: '0x14476de',
          },
        };
      }),
    await mockServer
      .forPost(infuraSepoliaUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return {
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
            result: '0x14476de',
          },
        };
      }),
    await mockServer
      .forPost(infuraLineaSepoliaUrl)
      .withBodyIncluding('eth_getBlockByNumber')
      .thenCallback(() => {
        return {
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
        await driver.delay(5000);
        await loginWithoutBalanceValidation(driver);
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        // Want to wait long enough  to pull requests relevant to a single loop cycle
        await driver.delay(20000);
        const infuraJsonRpcRequests = await getAllInfuraJsonRpcRequests(
          mockedEndpoint,
        );

        console.log(
          '🚀 ~ currentInfuraJsonRpcRequests:',
          infuraJsonRpcRequests,
        );
        // TODO: expecting the length of infuraJsonRpcRequests would be more accurate
        expect(
          infuraJsonRpcRequests.some((obj) => obj.method === 'eth_blockNumber'),
        ).toBeTruthy();
        expect(
          infuraJsonRpcRequests.some(
            (obj) => obj.method === 'eth_getBlockByNumber',
          ),
        ).toBeTruthy();
        expect(
          infuraJsonRpcRequests.some((obj) => obj.method === 'eth_call'),
        ).toBeTruthy();
      },
    );
  });
});
