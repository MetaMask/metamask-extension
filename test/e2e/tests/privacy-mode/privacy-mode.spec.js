const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Privacy Mode', function () {
  it('should activate privacy mode, then deactivate it', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withPreferencesController().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        async function checkForHeaderValue(value) {
          const balanceElement = await driver.findElement(
            '[data-testid="eth-overview__primary-currency"] .currency-display-component__text',
          );
          const surveyText = await balanceElement.getText();
          assert.equal(surveyText, value, `Balance should be "${value}"`);
        }

        async function checkForTokenValue(value) {
          const balanceElement = await driver.findElement(
            '[data-testid="multichain-token-list-item-secondary-value"]',
          );
          const surveyText = await balanceElement.getText();
          assert.equal(surveyText, value, `Balance should be "${value}"`);
        }

        async function checkForPrivacy() {
          await checkForHeaderValue('*****');
          await checkForTokenValue('*****');
        }

        async function checkForNoPrivacy() {
          await checkForHeaderValue('25');
          await checkForTokenValue('25 ETH');
        }

        async function togglePrivacy() {
          const balanceElement = await driver.findElement(
            '[data-testid="eth-overview__primary-currency"] .currency-display-component__text',
          );
          const initialText = await balanceElement.getText();

          await driver.clickElement('[data-testid="sensitive-toggle"]');
          await driver.wait(async () => {
            const currentText = await balanceElement.getText();
            return currentText !== initialText;
          }, 2e3);
        }

        await unlockWallet(driver);
        await checkForNoPrivacy();
        await togglePrivacy();
        await checkForPrivacy();
        await togglePrivacy();
        await checkForNoPrivacy();
      },
    );
  });
});
