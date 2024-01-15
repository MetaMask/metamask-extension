const {
  openDapp,
  switchToNotificationWindow,
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
  openActionMenuAndStartSendFlow,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  expectName,
  focusTestDapp,
  rejectSignatureOrTransactionRequest,
  saveName,
} = require('./petnames-helpers');

async function createTransactionRequestInDapp(driver) {
  await driver.clickElement('#sendButton');
  await driver.delay(3000);
}

async function createTransactionRequestInWallet(driver, recipientAddress) {
  await openActionMenuAndStartSendFlow(driver);
  await driver.fill(
    'input[placeholder="Enter public address (0x) or ENS name"]',
    recipientAddress,
  );

  await driver.findClickableElement({ text: 'Next', tag: 'button' });
  await driver.clickElement({ text: 'Next', tag: 'button' });
}

describe('Petnames - Transactions', function () {
  it('can save custom names for addresses in transaction requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesControllerPetnamesEnabled()
          .withNoNames()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await createTransactionRequestInDapp(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, '0x0c54F...7AaFb', false);

        // Test custom name.
        await saveName(driver, '0x0c54F...7AaFb', 'Custom Name', undefined);
        await rejectSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createTransactionRequestInDapp(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, 'Custom Name', true);

        // Test proposed name.
        await saveName(driver, 'Custom Name', undefined, 'test4.lens', true);
        await rejectSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createTransactionRequestInDapp(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, 'test4.lens', true);
      },
    );
  });

  it('can update custom names for addresses in transaction requests', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            featureFlags: {
              sendHexData: true,
            },
          })
          .withPreferencesControllerPetnamesEnabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        createTransactionRequestInWallet(
          driver,
          '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb',
        );

        // Test custom name.
        await saveName(driver, '0x0c54F...7AaFb', 'Custom Name', undefined);
        await rejectSignatureOrTransactionRequest(driver);
        await createTransactionRequestInWallet(
          driver,
          '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb',
        );
        await expectName(driver, 'Custom Name', true);

        // Test proposed name.
        await saveName(driver, 'Custom Name', undefined, 'test4.lens', true);
        await rejectSignatureOrTransactionRequest(driver);
        await createTransactionRequestInWallet(
          driver,
          '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb',
        );
        await expectName(driver, 'test4.lens', true);
      },
    );
  });
});
