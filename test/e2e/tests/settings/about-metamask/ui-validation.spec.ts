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
};

const exceptedUrl = {
  privacyPolicy: 'https://metamask.io/privacy.html',
  termsOfUse: 'https://metamask.io/terms.html',
  attributions: 'https://metamask.io/attributions.html',
  supportCenter: 'https://support.metamask.io',
  website: 'https://metamask.io/',
  contactUS: 'https://metamask.zendesk.com/hc/en-us',
};

const linkTexts = {
  privacyPolicy: 'Privacy policy',
  termsOfUse: 'Terms of use',
  attributions: 'Attributions',
  supportCenter: 'Support Center',
  website: 'Visit our website',
  contactUS: 'Contact us',
};

// This function is to click on the three dots and select the "Settings" option from the dropdown menu.
// Then, click on the "About" section from the left panel.
async function switchToAboutView(driver: Driver) {
  await driver.clickElement(selectors.accountOptionsMenuButton);
  await driver.clickElement(selectors.settingsDiv);
  await driver.clickElement(selectors.aboutDiv);
}

// Get the href value of the link
const getHrefValue = async (driver: Driver, linkText: string) => {
  const getHref = await driver.findElement({ text: linkText, tag: 'a' });
  return await getHref.getAttribute('href');
};

// Test case to validate the view and links in the "About" - MetaMask.
// This test is critical because it's the only way to access privacy policy and other important links.
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
        getHrefValue(driver, linkTexts.privacyPolicy).then((actualUrlValue) => {
          assert.strictEqual(
            actualUrlValue,
            exceptedUrl.privacyPolicy,
            'URLs are not equal',
          );
        });

        // Validate 'Terms of Use' link
        getHrefValue(driver, linkTexts.termsOfUse).then((actualUrlValue) => {
          assert.strictEqual(
            actualUrlValue,
            exceptedUrl.termsOfUse,
            'URLs are not equal',
          );
        });

        // Validate 'Attributions' link
        getHrefValue(driver, linkTexts.attributions).then((actualUrlValue) => {
          assert.strictEqual(
            actualUrlValue,
            exceptedUrl.attributions,
            'URLs are not equal',
          );
        });

        // Validate 'Support Center' link
        getHrefValue(driver, linkTexts.supportCenter).then((actualUrlValue) => {
          assert.strictEqual(
            actualUrlValue,
            exceptedUrl.supportCenter,
            'URLs are not equal',
          );
        });

        // Validate 'Visit our website' link
        getHrefValue(driver, linkTexts.website).then((actualUrlValue) => {
          assert.strictEqual(
            actualUrlValue,
            exceptedUrl.website,
            'URLs are not equal',
          );
        });

        // Validate 'Contact us' link
        getHrefValue(driver, linkTexts.contactUS).then((actualUrlValue) => {
          assert.strictEqual(
            actualUrlValue,
            exceptedUrl.contactUS,
            'URLs are not equal',
          );
        });

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
