const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Confirmation Redesign Contract Interaction Component', function () {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it.only(`Opens a contract interaction type 2 transaction`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptionsForType2Transactions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#deployButton`);

        await driver.delay(2 ** 5);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Contract deployment',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#depositButton`);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: 'h2',
          text: 'Transaction request',
        });

        await driver.delay(1024 ** 2);
      },
    );
  });

  it(`Opens a contract interaction type 1 transaction`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#deployButton`);

        await driver.delay(2 ** 5);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Contract deployment',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#depositButton`);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: 'h2',
          text: 'Transaction request',
        });

        // await driver.delay(1024 ** 2);
      },
    );
  });
});
