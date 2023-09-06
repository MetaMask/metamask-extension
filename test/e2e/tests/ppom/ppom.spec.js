const { strict: assert } = require('assert');
const { withFixtures, openDapp, convertToHexValue } = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const infuraUrl =
    'https://mainnet.infura.io/v3/00000000000000000000000000000000';


async function mockGanache(mockServer) {
  return [
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_blockNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: '0x113b9d2',
          },
        };
      }),

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {

              jsonrpc: "2.0",
              id: 5886462286348904,
              result: {
                  baseFeePerGas: "0x338f8331d",
                  difficulty: "0x0",
                  extraData: "0x496c6c756d696e61746520446d6f63726174697a6520447374726962757465",
                  gasLimit: "0x1c9c380",
                  gasUsed: "0xd63a1a",
                  hash: "0xddc7ac723e6dac3d4b67ca47fce208f808e45dde3ac118aeb7bb71f8da97d1f4",
                  logsBloom: "0x3965211d41a66e8e191d09b4ad65f1a09fac5e353bd5f192ceb108262e220d5c058519cd5f8e06594a3c3f2243b01162231f13408f236851004e912f3d7d2014029b6359556a28296bc7422f542c362880f10450094f2aa0267414c5ca64b8691ad14c56ba3ae70b307d978c08295deff6b309e30ec9bf88a6f33f32b9099cc59ac6da7c20543b5406760b8f078a24db318a8cb5b90106ee5aac27d33794062a8e60517a5f85e278ba0388ee189a8c06468fcd1d6a4a86e308e4040a024845505204a26202895e433fb12e21c467849ea1fdc02ad5a0211a8e25e2160807e11439baa548b1d487a902c5f6b86a120d488325f0fc6bc9064042cdb16fef2916ab",
                  miner: "0xdafea492d9c6733ae3d56b7ed1adb60692c98bc5",
                  mixHash: "0x72c45ddf77caa464e9ea5f27a097d5720d380a87cce9d370f091bcbab3be0992",
                  nonce: "0x0000000000000000",
                  number: "0x113b9d2",
                  parentHash: "0xb267c3e910437e3019102f56379bfe45cdaf2974693700fc3e08d327da61eb75",
                  receiptsRoot: "0xc6687b782ccb7051348f59f674a0d20370c28e340d66017b0b4b47c8f2ad0a2e",
                  sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
                  size: "0x3977f",
                  stateRoot: "0x00d0f013a9cd46f3ad1bcd36f30b8c2e50a8eac1b8f1aa1b2d2fbc83a60fb580",
                  timestamp: "0x64f7106b",
                  totalDifficulty: "0xc70d815d562d3cfa955",
                  transactions: [],
                  transactionsRoot: "0xb1d0dbc5c9394f71bac833c041f8ae32ab120dc08f44d8496eeebe4b7340bb95",
                  uncles: [],
                  withdrawals: [],
                  withdrawalsRoot: "0xc524071a1a2297c6af3ec32a493010ddf483de5f741e5b4b57cacc4aeef6d99d"
              }
          },
        };
      }),

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: '0x15AF1D78B58C40000',
          },
        };
      }),

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: {},
          },
        };
      }),

    // balance checker USDC
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({
        method: "eth_call",
        params:[{
          to:"0xb1f8e55c7f64d203c1400b9d8555d050f94adf39",
        }]
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            result: '0x2CDCB7E71434D',
          }
        };
      }),

      // balanceOf USDC
      await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({
        method: "eth_call",
        params:[{
          to:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        }]
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            result: '0x2CDCB7E71434D',
          }
        };
      }),
  ];
}

const ganacheOptions = {
  accounts: [
    {
      secretKey:
        '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
      balance: convertToHexValue(25000000000000000000),
    },
  ],
};

describe('Privacy Preserving Offline Module', function () {
  it(`displays warning for Send Malicious Eth`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withNetworkController({
            networkId: '1',
            providerConfig: {
              chainId: '0x1',
              nickname: '',
              rpcUrl: '',
              type: 'mainnet',
            },
          })
          .build(),
        ganacheOptions,
        testSpecificMock: mockGanache,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#maliciousApprovalButton');

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const deceptiveWarning = await driver.isElementPresent({
          tag: 'p',
          text: 'This is a deceptive request',
        });
        assert.equal(deceptiveWarning, true);
      },
    );
  });

  it(`displays warning for Malicious Permit`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withNetworkController({
            selectedNetworkClientId: 'mainnet',
            networkId: '1',
            providerConfig: {
              type: 'mainnet',
              chainId: '0x1',
              ticker: 'ETH',
              rpcPrefs: {
                blockExplorerUrl: 'https://etherscan.io',
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#maliciousPermit');

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const deceptiveWarning = await driver.isElementPresent({
          tag: 'p',
          text: 'This is a deceptive request',
        });
        assert.equal(deceptiveWarning, true);
      },
    );
  });
  it(`displays warning for Malicious Trade Order`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withNetworkController({
            selectedNetworkClientId: 'mainnet',
            networkId: '1',
            providerConfig: {
              type: 'mainnet',
              chainId: '0x1',
              ticker: 'ETH',
              rpcPrefs: {
                blockExplorerUrl: 'https://etherscan.io',
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#maliciousTradeOrder');

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const deceptiveWarning = await driver.isElementPresent({
          tag: 'p',
          text: 'This is a deceptive request',
        });
        assert.equal(deceptiveWarning, true);
      },
    );
  });

  it(`displays warning for Malicious Seaport`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withNetworkController({
            selectedNetworkClientId: 'mainnet',
            networkId: '1',
            providerConfig: {
              type: 'mainnet',
              chainId: '0x1',
              ticker: 'ETH',
              rpcPrefs: {
                blockExplorerUrl: 'https://etherscan.io',
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#maliciousSeaport');

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const deceptiveWarning = await driver.isElementPresent({
          tag: 'p',
          text: 'This is a deceptive request',
        });
        assert.equal(deceptiveWarning, true);
      },
    );
  });
});
