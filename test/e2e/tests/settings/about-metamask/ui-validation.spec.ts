import assert from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import packageJson from '../../../../../package.json';

const selectors = {
  accountOptionsMenuButton: '[data-testid="account-options-menu-button"]',
  settingsDiv: { text: 'Settings', tag: 'div' },
  aboutDiv: { text: 'About', tag: 'div' },
  metaMaskLabelText: { text: 'MetaMask Version', tag: 'div' },
  metaMaskVersion: '.info-tab__version-number',
  headerText: {
    text: 'MetaMask is designed and built around the world.',
    tag: 'div',
  },
  titleText: { text: 'About', tag: 'h4' },
  closeButton: '.mm-box button[aria-label="Close"]',
  walletOverview: '.wallet-overview__balance',
  privacyPolicy: { text: 'Privacy Policy', tag: 'h1' },
  termsOfUse: { text: 'Terms of Use', tag: 'h1' },
  attributions: { text: 'Attributions', tag: 'h1' },
  website: { text: 'Get started with MetaMask Portfolio', tag: 'div' },
};

async function switchToAboutView(driver: Driver) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsDiv);
  await driver.clickElement(selectors.aboutDiv);
}

const validateLink = async (
  driver: Driver,
  linkText: string,
  title: string,
  expectedUrl: string,
  expectedHeading: any,
) => {
  // Click on the link
  await driver.clickElement({ text: linkText, tag: 'a' });

  // Switch to the new window
  await driver.switchToWindowWithTitle(title);

  // Validate the URL
  assert.equal(await driver.getCurrentUrl(), expectedUrl);

  // Validate the heading
  const isHeadingPresent = await driver.isElementPresent(expectedHeading);
  assert.equal(
    isHeadingPresent,
    true,
    `${linkText} heading is not present in the page`,
  );
};

describe('Setting - About MetaMask : @no-mmi', function (this: Suite) {
  it('validate the view and links', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // navigate to settings and click on about view
        await switchToAboutView(driver);

        // Validate 'Privacy Policy' link
        await validateLink(
          driver,
          'Privacy policy',
          'Privacy Policy | Consensys',
          'https://consensys.io/privacy-policy',
          selectors.privacyPolicy,
        );

        await driver.switchToWindowWithTitle('MetaMask');
        // Validate 'Terms of Use' link
        await validateLink(
          driver,
          'Terms of use',
          'Terms of use | Consensys',
          'https://consensys.io/terms-of-use',
          selectors.termsOfUse,
        );

        await driver.switchToWindowWithTitle('MetaMask');
        // Validate 'Attributions' link
        await validateLink(
          driver,
          'Attributions',
          'Attributions | MetaMask',
          'https://metamask.io/attributions/',
          selectors.attributions,
        );

        await driver.switchToWindowWithTitle('MetaMask');
        // Validate 'Visit our website' link
        await validateLink(
          driver,
          'Visit our website',
          'The Ultimate Crypto Wallet for DeFi, Web3 Apps, and NFTs | MetaMask',
          'https://metamask.io/',
          selectors.website,
        );

        await driver.switchToWindowWithTitle('MetaMask');

        // Validating the title
        const isTitlePresent = await driver.isElementPresent(
          selectors.titleText,
        );
        assert.equal(
          isTitlePresent,
          true,
          'Meta Mask title is not present in the about view section',
        );

        // Validating the header label
        const isMetaMaskLabelPresent = await driver.isElementPresent(
          selectors.metaMaskLabelText,
        );
        assert.equal(
          isMetaMaskLabelPresent,
          true,
          'Meta Mask label is not present in the about view section',
        );

        // verify the version number of the MetaMask
        const metaMaskVersion = await driver.findElement(
          selectors.metaMaskVersion,
        );
        const getVersionNumber = await metaMaskVersion.getText();
        const { version } = packageJson;
        assert.equal(
          getVersionNumber,
          version,
          'Meta Mask version is incorrect in the about view section',
        );

        // Validating the header text
        const isHeaderTextPresent = await driver.isElementPresent(
          selectors.headerText,
        );
        assert.equal(
          isHeaderTextPresent,
          true,
          'Meta Mask header text is not present in the about view section',
        );
        // click on `close` button
        await driver.clickElement(selectors.closeButton);

        // wait for the wallet-overview__balance to load
        await driver.waitForSelector(selectors.walletOverview);

        // Validate the navigate to the wallet overview page
        const isWalletOverviewPresent = await driver.isElementPresent(
          selectors.walletOverview,
        );

        assert.equal(
          isWalletOverviewPresent,
          true,
          'Wallet overview page is not present',
        );
      },
    );
  });
});
