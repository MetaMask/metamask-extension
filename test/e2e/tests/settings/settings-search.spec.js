const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  openMenuSafe,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Settings Search', function () {
  const settingsSearch = {
    general: 'Primary currency',
    advanced: 'State logs',
    contacts: 'Contacts',
    security: 'Reveal Secret',
    alerts: 'Browsing a website',
    networks: 'Ethereum Mainnet',
    experimental: 'Nicknames',
    about: 'Terms of Use',
  };

  it('should find element inside the General tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('General test started', Date.now());
        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.general);

        const page = 'General';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.general} item does not redirect to ${page} view`,
        );
        console.log('General test end', Date.now());
      },
    );
  });
  it('should find element inside the Advanced tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Advanced test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.advanced);

        // Check if element redirects to the correct page
        const page = 'Advanced';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.advanced} item does not redirect to ${page} view`,
        );
        console.log('Advanced test ended', Date.now());

      },
    );
  });
  it('should find element inside the Contacts tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Contacts test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.contacts);

        // Check if element redirects to the correct page
        const page = 'Contacts';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.contacts} item does not redirect to ${page} view`,
        );
        console.log('Contacts test ended', Date.now());

      },
    );
  });
  it('should find element inside the "Security & privacy" tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Security & privacy test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.security);

        // Check if element redirects to the correct page
        const page = 'Security';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.security} item does not redirect to ${page} view`,
        );
        console.log('Security & privacy test ended', Date.now());

      },
    );
  });
  it('should find element inside the Alerts tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Alerts test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.alerts);

        // Check if element redirects to the correct page
        const page = 'Alerts';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.alerts} item does not redirect to ${page} view`,
        );
        console.log('Alerts test ended', Date.now());

      },
    );
  });
  it('should find element inside the Networks tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Networks test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.networks);

        // Check if element redirects to the correct page
        const page = 'Networks';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.networks} item does not redirect to ${page} view`,
        );
        console.log('Networks test ended', Date.now());

      },
    );
  });
  it('should find element inside the Experimental tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Experimental test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.experimental);

        // Check if element redirects to the correct page
        const page = 'Experimental';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.experimental} item not redirect to ${page} view`,
        );
        console.log('Experimental test ended', Date.now());

      },
    );
  });
  it('should find element inside the About tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {

        console.log('About test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settingsSearch.about);

        // Check if element redirects to the correct page
        const page = 'About';
        await driver.clickElement({ text: page, tag: 'span' });
        assert.equal(
          await driver.isElementPresent({ text: page, tag: 'div' }),
          true,
          `${settingsSearch.about} item does not redirect to ${page} view`,
        );
        console.log('About test ended', Date.now());

      },
    );
  });
  it('should display "Element not found" for a non-existing element', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        console.log('Element not found test started', Date.now());

        await unlockWallet(driver);

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', 'Lorem ipsum');

        const found = await driver.isElementPresent({
          text: 'No matching results found',
          tag: 'span',
        });
        assert.equal(found, true, 'Non existent element was found');
        console.log('Element not found test ended', Date.now());

      },
    );
  });
});
