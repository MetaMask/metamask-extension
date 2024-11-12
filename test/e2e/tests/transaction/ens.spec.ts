import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';


const CONTRACT_ADDRESS = {
  BalanceCheckerEthereumMainnet: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  BalanceCheckerLineaMainnet: '0xf62e6a41561b3650a69bb03199c735e3e3328c0d',
};

describe('ENS', function (this: Suite) {
  const sampleAddress: string = '1111111111111111111111111111111111111111';

  // Having 2 versions of the address is a bug(#25286)
  const shortSampleAddress = '0x1111...1111';
  const shortSampleAddresV2 = '0x11111...11111';
  const chainId = 1;
  const mockResolver = '226159d592e2b063810a10ebf6dcbada94ed68b8';

  const sampleEnsDomain: string = 'test.eth';
  const infuraUrl: string =
    'https://mainnet.infura.io/v3/00000000000000000000000000000000';
  const infuraLineaMainnetUrl: string =
    'https://linea-mainnet.infura.io/v3/00000000000000000000000000000000';
  const infuraLineaSepoliaUrl: string =
    'https://linea-sepolia.infura.io/v3/00000000000000000000000000000000';
  const infuraSepoliaUrl: string =
    'https://sepolia.infura.io/v3/00000000000000000000000000000000';

  async function mockInfura(mockServer: MockttpServer): Promise<void> {
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x1BC16D674EC8',
        },
      }));
    await mockServer
      .forPost(infuraSepoliaUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6183194981233610',
          result: '0x1BC16D674EC8',
        },
      }));
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6183194981233610',
          result: '0x1BC16D674EC8',
        },
      }));
    await mockServer
      .forPost(infuraLineaSepoliaUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6183194981233610',
          result: '0x1BC16D674EC8',
        },
      }));

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '6183194981233610',
          result: '0x1',
        },
    }));
    await mockServer
      .forPost(infuraLineaMainnetUrl)
      .withJsonBodyIncluding({ method: 'eth_call' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000001BC16D674EC800000000000000000000000000000000000000000000000000000001699651aa88200000000000000000000000000000000000000000000000000001beca58919dc0000000000000000000000000000000000000000000000000000974189179054f0000000000000000000000000000000000000000000000000001d9ae54845818000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110d9316ec0000000000000000000000000000000000000000000000000000000000000000000',
        },
      }));

    await mockServer
      .forGet('https://accounts.api.cx.metamask.io/v2/accounts/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/balances')
      .withQuery({
        networks: 1
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          count:0,
          balances:[
            {
              "object": "token",
              "address": "0x45804880de22913dafe09f4980848ece6ecbaf78",
              "name": "Paxos Gold",
              "symbol": "PAXG",
              "decimals": 18,
              "balance": "0.000199960000000000",
              "chainId": 1
          },
          {
              "object": "token",
              "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
              "name": "Dai Stablecoin",
              "symbol": "DAI",
              "decimals": 18,
              "balance": "1.371534639562184532",
              "chainId": 1
          },
          {
              "object": "token",
              "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              "name": "USD Coin",
              "symbol": "USDC",
              "decimals": 6,
              "balance": "0.033000",
              "chainId": 1
          },
          {
              "object": "token",
              "address": "0x0000000000000000000000000000000000000000",
              "symbol": "ETH",
              "name": "Ether",
              "type": "native",
              "timestamp": "2015-07-30T03:26:13.000Z",
              "decimals": 18,
              "chainId": 1,
              "balance": "2"
          }
          ],
          unprocessedNetworks:[],
        },
      }));



    await mockServerJsonRpc(mockServer, [
      ['eth_blockNumber'],
      ['eth_getBlockByNumber'],
      ['eth_chainId', { result: `0x${chainId}` }],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
              data: '0x0178b8bfeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1',
            },
          ],
          result: `0x000000000000000000000000${mockResolver}`,
        },
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: `0x${mockResolver}`,
              data: '0x01ffc9a79061b92300000000000000000000000000000000000000000000000000000000',
            },
          ],
          result: `0x0000000000000000000000000000000000000000000000000000000000000000`,
        },
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: `0x${mockResolver}`,
              data: '0x3b3b57deeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1',
            },
          ],
          result: `0x000000000000000000000000${sampleAddress}`,
        },
      ],
      [
        'eth_call',
        {
          methodResultVariant: 'balanceChecker',
          params: [{ to: CONTRACT_ADDRESS.BalanceCheckerEthereumMainnet }],
        },
      ],
    ]);
  }

  it('domain resolves to a correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withAccountTracker({
            accounts: {
                "0x5cfe73b6021e818b776b421b1c4db2474086a7e1": {
                    address: "0x5cfe73b6021e818b776b421b1c4db2474086a7e1",
                    balance: "0x1bc16d674ec80000"
                }
            },
            currentBlockGasLimit: '0x1c9c380',
            accountsByChainId: {
                "0x1": {
                    "0x5cfe73b6021e818b776b421b1c4db2474086a7e1": {
                        address: "0x5cfe73b6021e818b776b421b1c4db2474086a7e1",
                        balance: "0x1bc16d674ec80000"
                    }
                }
            },
            currentBlockGasLimitByChainId: {
              '0x1': '0x1c9c380',
            },
          })
          .withNameController({
            names: {
              ethereumAddress: {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                  '*': {
                    name: 'Account 1',
                    sourceId: null,
                    proposedNames: {},
                    origin: 'account-identity',
                  },
                },
              }
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        // click send button on homepage to start send flow
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed('<0.000001');
        await homepage.startSendFlow();

        // fill ens address as recipient when user lands on send token screen
        const sendToPage = new SendTokenPage(driver);
        await sendToPage.check_pageIsLoaded();
        await sendToPage.fillRecipient(sampleEnsDomain);

        // verify that ens domain resolves to the correct address
        await sendToPage.check_ensAddressResolution(
          sampleEnsDomain,
          shortSampleAddress,
        );

        // Verify the resolved ENS address can be used as the recipient address
        await sendToPage.check_ensAddressAsRecipient(
          sampleEnsDomain,
          shortSampleAddresV2,
        );
      },
    );
  });
});
