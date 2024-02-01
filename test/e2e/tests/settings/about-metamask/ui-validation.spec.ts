import assert from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';

const selectors = {
  accountOptionsMenu: '[data-testid="account-options-menu-button"]',
  settingsDiv: { text: 'Settings', tag: 'div' },
  aboutDiv: { text: 'About', tag: 'div' },
  metaMaskLabelText: { text: 'MetaMask Version', tag: 'div' },
  metaMaskVersion: { text: '11.7.3', tag: 'div' },
  headerText: {
    text: 'MetaMask is designed and built around the world.',
    tag: 'div',
  },
  headingText: { text: 'About', tag: 'h4' },
  buttonAddressCopy: '[data-testid="address-copy-button-text"]',
};

async function switchToAboutView(driver: Driver) {
  await driver.clickElement(selectors.accountOptionsMenu);
  await driver.clickElement(selectors.settingsDiv);
  await driver.clickElement(selectors.aboutDiv);
}

describe('Setting - About MetaMask :', function (this: Suite) {
  it('validate the view', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // navigate to settings and click on about view
        await switchToAboutView(driver);

        // Validating the heading text
        const isHeadingText = await driver.isElementPresent(
          selectors.headingText,
        );
        assert.equal(
          isHeadingText,
          true,
          'Meta Mask heading text is not present in the about view section',
        );

        // Validating the header label
        const isHeaderMetaMaskLabel = await driver.isElementPresent(
          selectors.metaMaskLabelText,
        );
        assert.equal(
          isHeaderMetaMaskLabel,
          true,
          'Meta Mask label is not present in the about view section',
        );

        // verify the version number in the about view section to the fixture builder version as 11.7.3
        const validationMetaMaskVersion = await driver.isElementPresent(
          selectors.metaMaskVersion,
        );
        assert.equal(
          validationMetaMaskVersion,
          true,
          'Meta Mask version is not present in the about view section',
        );

        // Validating the header text
        const isHeaderText = await driver.isElementPresent(
          selectors.headerText,
        );
        assert.equal(
          isHeaderText,
          true,
          'Meta Mask header text is not present in the about view section',
        );
      },
    );
  });

  it('close button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // navigate to settings and click on about view
        await switchToAboutView(driver);

        // click on `close` button
        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // wait for the wallet-overview__balance to load
        await driver.isElementPresent('.wallet-overview__balance');

        // Validate the navigate to the wallet overview page
        const isWalletOverview = await driver.isElementPresent(
          selectors.buttonAddressCopy,
        );

        assert.equal(
          isWalletOverview,
          true,
          'Wallet overview page is not present',
        );
      },
    );
  });
});
