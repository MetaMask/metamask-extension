const {
  openDapp,
  switchToNotificationWindow,
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  expectName,
  focusTestDapp,
  rejectSignatureOrTransactionRequest,
  saveName,
} = require('./petnames-helpers');

async function createTransactionRequest(driver) {
  await driver.clickElement('#sendButton');
  await driver.delay(3000);
}

describe('Petnames', function () {
  it('can save names for addresses in transaction requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNoNames()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await createTransactionRequest(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, '0x0c54F...7AaFb', false);
        await saveName(driver, '0x0c54F...7AaFb', 'test.lens', undefined);
        await rejectSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createTransactionRequest(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, 'test.lens', true);
      },
    );
  });
});
