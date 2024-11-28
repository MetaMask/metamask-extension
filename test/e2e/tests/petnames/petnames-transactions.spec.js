const {
  openDapp,
  switchToNotificationWindow,
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
  openActionMenuAndStartSendFlow,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const {
  expectName,
  focusTestDapp,
  rejectSignatureOrTransactionRequest,
  saveName,
} = require('./petnames-helpers');

async function createDappSendTransaction(driver) {
  await driver.clickElement('#sendButton');
  await driver.delay(3000);
}

async function createWalletSendTransaction(driver, recipientAddress) {
  await openActionMenuAndStartSendFlow(driver);
  await driver.fill(
    'input[placeholder="Enter public address (0x) or domain name"]',
    recipientAddress,
  );

  await driver.findClickableElement({ text: 'Continue', tag: 'button' });
  await driver.clickElement({ text: 'Continue', tag: 'button' });
}

const ADDRESS_MOCK = '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb';
const ABBREVIATED_ADDRESS_MOCK = '0x0c54F...7AaFb';
const CUSTOM_NAME_MOCK = 'Custom Name';
const PROPOSED_NAME_MOCK = 'test4.lens';

describe('Petnames - Transactions', function () {
  it('can save petnames for addresses in dapp send transactions', async function () {
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

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        await openDapp(driver);
        await createDappSendTransaction(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, ABBREVIATED_ADDRESS_MOCK, false);

        // Test custom name.
        await saveName(
          driver,
          ABBREVIATED_ADDRESS_MOCK,
          CUSTOM_NAME_MOCK,
          undefined,
        );
        await rejectSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createDappSendTransaction(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await saveName(driver, CUSTOM_NAME_MOCK, undefined, PROPOSED_NAME_MOCK);
        await rejectSignatureOrTransactionRequest(driver);
        await focusTestDapp(driver);
        await createDappSendTransaction(driver);
        await switchToNotificationWindow(driver, 3);
        await expectName(driver, PROPOSED_NAME_MOCK, true);
      },
    );
  });

  it('can save petnames for addresses in wallet send transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            featureFlags: {
              sendHexData: true,
            },
          })
          .withNoNames()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        await createWalletSendTransaction(driver, ADDRESS_MOCK);
        await expectName(driver, ABBREVIATED_ADDRESS_MOCK, false);

        // Test custom name.
        await saveName(
          driver,
          ABBREVIATED_ADDRESS_MOCK,
          CUSTOM_NAME_MOCK,
          undefined,
        );
        await rejectSignatureOrTransactionRequest(driver);
        await createWalletSendTransaction(driver, ADDRESS_MOCK);
        await expectName(driver, CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await saveName(driver, CUSTOM_NAME_MOCK, undefined, PROPOSED_NAME_MOCK);
        await rejectSignatureOrTransactionRequest(driver);
        await createWalletSendTransaction(driver, ADDRESS_MOCK);
        await expectName(driver, PROPOSED_NAME_MOCK, true);
      },
    );
  });
});
