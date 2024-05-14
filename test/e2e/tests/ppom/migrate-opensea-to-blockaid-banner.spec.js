const { connectAccountToTestDapp } = require('../../accounts/common');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
  openDapp,
  WINDOW_TITLES,
} = require('../../helpers');

describe('Migrate Opensea to Blockaid Banner @no-mmi', function () {
  const ONE_CLICK_CONFIRMATIONS_USING_BLOCKAID = [
    { name: 'Personal Sign signature', testDAppBtnId: 'personalSign' },
    { name: 'Sign Typed Data signature', testDAppBtnId: 'signTypedData' },
    { name: 'Sign Typed Data v3 signature', testDAppBtnId: 'signTypedDataV3' },
    { name: 'Sign Typed Data v4 signature', testDAppBtnId: 'signTypedDataV4' },
    { name: 'Sign Permit signature', testDAppBtnId: 'signPermit' },
    { name: 'Simple Send transaction', testDAppBtnId: 'sendButton' },
    {
      name: 'Contract Interaction transaction',
      testDAppBtnId: 'deployMultisigButton',
    },
  ];

  ONE_CLICK_CONFIRMATIONS_USING_BLOCKAID.forEach((confirmation) => {
    it(`Shows up on ${confirmation.name} confirmations`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              hasMigratedFromOpenSeaToBlockaid: true,
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await openDapp(driver);

          await connectAccountToTestDapp(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.clickElement(`#${confirmation.testDAppBtnId}`);
          await driver.delay(2000);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
        },
      );
    });
  });

  it('Shows up on Token Approval transaction confirmations', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({ hasMigratedFromOpenSeaToBlockaid: true })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await connectAccountToTestDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.findClickableElement('#createToken');
        await driver.clickElement('#createToken');
        await driver.delay(2000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });
        await driver.delay(2000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
      },
    );
  });
});
