const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  largeDelayMs,
  veryLargeDelayMs,
  WINDOW_TITLES,
} = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('4byte setting', function () {
  it('makes a call to 4byte when the setting is on', async function () {
    const smartContract = SMART_CONTRACTS.PIGGYBANK;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await unlockWallet(driver);

        // deploy contract
        await openDapp(driver, contractAddress);

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.delay(largeDelayMs);
        await driver.clickElement('#depositButton');

        await driver.waitForSelector({
          css: 'span',
          text: 'Deposit initiated',
        });

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Notification);
        const actionElement = await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });
        assert.equal(await actionElement.getText(), 'DEPOSIT');
      },
    );
  });

  it('does not try to get contract method name from 4byte when the setting is off', async function () {
    const smartContract = SMART_CONTRACTS.PIGGYBANK;
    const fourBytePrefix = '0xd0e30db0';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test.title,
        testSpecificMock: async (mockServer) => {
          await mockServer
            .forGet(`https://www.4byte.directory/api/v1/signatures/`)
            .withQuery({ hex_signature: fourBytePrefix })
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
                      text_signature: 'deposit()',
                      hex_signature: null,
                      bytes_signature: null,
                    },
                  ],
                },
              };
            });
        },
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await unlockWallet(driver);

        // goes to the settings screen
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        // turns off 4Byte Directory contract method name resolution
        await driver.clickElement(
          '[data-testid="4byte-resolution-container"] .toggle-button',
        );

        // deploy contract
        await openDapp(driver, contractAddress);

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.delay(largeDelayMs);
        await driver.clickElement('#depositButton');

        await driver.waitForSelector({
          css: 'span',
          text: 'Deposit initiated',
        });

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Notification);
        const actionElement = await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Contract interaction',
        });
        await driver.delay(veryLargeDelayMs);

        assert.equal(await actionElement.getText(), 'CONTRACT INTERACTION');
      },
    );
  });
});
