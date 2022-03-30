const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Settings Search', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  const settings = {
    general: {
      urlSubstring: 'general',
      target: 'Primary Currency',
    },
    advanced: {
      urlSubstring: 'advanced',
      target: 'State Logs',
    },
    contacts: {
      urlSubstring: 'contact-list',
      target: 'Contacts',
    },
    security: {
      urlSubstring: 'security',
      target: 'Reveal Secret',
    },
    alerts: {
      urlSubstring: 'alerts',
      target: 'Browsing a website',
    },
    networks: {
      urlSubstring: 'networks',
      target: 'Ethereum Mainnet',
    },
    experimental: {
      urlSubstring: 'experimental',
      target: 'Token Detection',
    },
    about: {
      urlSubstring: 'about-us',
      target: 'Terms of Use',
    },
  };
  let found;
  let url;

  it('should find element inside the General tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.general.target);

        // Check if element was found
        found = await driver.isElementPresent({ text: 'General', tag: 'span' });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'General', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.general.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the Advanced tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.advanced.target);

        // Check if element was found
        found = await driver.isElementPresent({
          text: 'Advanced',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'Advanced', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.advanced.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the Contacts tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.contacts.target);

        // Check if element was found
        found = await driver.isElementPresent({
          text: 'Contacts',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'Contacts', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.contacts.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the Security tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.security.target);

        // Check if element was found
        found = await driver.isElementPresent({
          text: 'Security',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'Security', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.security.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the Alerts tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.alerts.target);

        // Check if element was found
        found = await driver.isElementPresent({ text: 'Alerts', tag: 'span' });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'Alerts', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.alerts.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the Networks tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.networks.target);

        // Check if element was found
        found = await driver.isElementPresent({
          text: 'Networks',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'Networks', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.networks.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the Experimental tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.experimental.target);

        // Check if element was found
        found = await driver.isElementPresent({
          text: 'Experimental',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'Experimental', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.experimental.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should find element inside the About tab', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', settings.about.target);

        // Check if element was found
        found = await driver.isElementPresent({ text: 'About', tag: 'span' });
        assert.equal(found, true, 'Element was not found');

        // Check if element redirects to the correct page
        await driver.clickElement({ text: 'About', tag: 'span' });
        url = await driver.getUrl();
        assert.equal(
          url.includes(settings.about.urlSubstring),
          true,
          'Item does not redirect to correct page',
        );
      },
    );
  });
  it('should display "Element not found" for a non-existing element', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.fill('#search-settings', 'Lorem ipsum');

        found = await driver.isElementPresent({
          text: 'No matching results found',
          tag: 'span',
        });
        assert.equal(found, true, 'Non existent element was found');
      },
    );
  });
});
