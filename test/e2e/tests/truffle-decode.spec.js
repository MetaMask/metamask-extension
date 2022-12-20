const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Truffle Decode', function () {
  async function mockFunctionSignature(mockServer) {
    await mockServer
      .forGet(
        'https://www.4byte.directory/api/v1/signatures/',
      )
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: 1,
                created_at: null,
                text_signature: 'checkString(string)',
                hex_signature: '0xa454b07b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000054c6f72656d000000000000000000000000000000000000000000000000000000',
                bytes_signature: null,
              },
            ],
          },
        };
      });
  }
  const smartContract = SMART_CONTRACTS.DECODER;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
    chainId: 5,
  };
  it('should transfer a single NFT from one account to another', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNetworkController({
            provider: {
              ticker: 'ETH',
              type: 'rpc',
              rpcUrl: 'http://localhost:8545',
              chainId: '0x5',
              nickname: 'Localhost 8545',
            },
            network: '5',
          })
          .withPreferencesController({
            frequentRpcListDetail: [
              {
                rpcUrl: 'http://localhost:8545',
                chainId: '0x5',
                ticker: 'ETH',
                nickname: 'Localhost 8545',
                rpcPrefs: {},
              },
            ],
          })
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
        testSpecificMock: mockFunctionSignature,
        failOnConsoleError: false,
      },
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open Dapp and wait for deployed contract
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        const windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement({ text: 'Check String Type', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Data', tag: 'button' });
        await driver.clickElement({ text: 'Dataasdad', tag: 'button' });
      });
  });
});
