const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Truffle Decode', function () {
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
        failOnConsoleError: false,
      },
      async ({ driver, _, contractRegistry }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open Dapp and wait for deployed contract
        await driver.openNewPage(`http://127.0.0.1:8080/?contract=${contract}`);
        
        await driver.clickElement({ text: 'Deploy Decoder Contract', tag: 'button' });
        const windowHandles = await driver.getAllWindowHandles();
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        
       await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

       await driver.delay(5000)
        await driver.clickElement({ text: 'Check String Type', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.delay(5000)

        await driver.clickElement({ text: 'Data', tag: 'button' });
        await driver.delay(2000)
        await driver.clickElement({ text: 'Dataasdad', tag: 'button' });
      });
  });
});
