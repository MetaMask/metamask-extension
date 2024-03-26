// const { strict: assert } = require('assert');
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
  it('Shows up on simple send transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: { hasMigratedFromOpenSeaToBlockaid: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        await connectAccountToTestDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement('#sendButton');
        await driver.delay(2000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
      },
    );
  });

  it('Shows up on token approval', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: { hasMigratedFromOpenSeaToBlockaid: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
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

  it('Shows up on personal signature', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: { hasMigratedFromOpenSeaToBlockaid: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        await connectAccountToTestDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement('#personalSign');
        await driver.delay(2000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
      },
    );
  });

  it('Shows up on contract interaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            preferences: { hasMigratedFromOpenSeaToBlockaid: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        await connectAccountToTestDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await driver.clickElement('#deployMultisigButton');
        await driver.delay(2000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
      },
    );
  });
});
