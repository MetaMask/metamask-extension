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
          assert.equal(
            surveyText,
            value,
            `Header balance should be "${value}"`,
          );
        }

        async function checkForTokenValue(value) {
          const balanceElement = await driver.findElement(
            '[data-testid="multichain-token-list-item-secondary-value"]',
          );
          const surveyText = await balanceElement.getText();
          assert.equal(surveyText, value, `Token balance should be "${value}"`);
        }

        async function checkForPrivacy() {
          await checkForHeaderValue('••••••');
          await checkForTokenValue('•••••••••');
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

  it('should hide fiat balance and token balance when privacy mode is activated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withPreferencesController().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

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

        await togglePrivacy();
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const valueText = await driver.findElement(
          '[data-testid="account-value-and-suffix"]',
        );
        const valueTextContent = await valueText.getText();

        assert.equal(valueTextContent, '••••••');
      },
    );
  });
});
