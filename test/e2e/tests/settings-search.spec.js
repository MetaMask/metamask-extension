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
  const searchableItems = {
    general: 'Primary Currency',
    advanced: 'State Logs',
    contacts: 'Contacts',
    security: 'Reveal Secret',
    alerts: 'Browsing a website',
    networks: 'Ethereum Mainnet',
    experimental: 'Token Detection',
    about: 'Terms of Use',
  };
  let found;
  let notFound;

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
        await driver.fill('#search-settings', searchableItems.general);

        found = await driver.isElementPresent({ text: 'General', tag: 'span' });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.advanced);

        found = await driver.isElementPresent({
          text: 'Advanced',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.contacts);

        found = await driver.isElementPresent({
          text: 'Contacts',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.security);

        found = await driver.isElementPresent({
          text: 'Security',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.alerts);

        found = await driver.isElementPresent({ text: 'Alerts', tag: 'span' });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.networks);

        found = await driver.isElementPresent({
          text: 'Networks',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.experimental);

        found = await driver.isElementPresent({
          text: 'Experimental',
          tag: 'span',
        });
        assert.equal(found, true, 'Element was not found');
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
        await driver.fill('#search-settings', searchableItems.about);

        found = await driver.isElementPresent({ text: 'About', tag: 'span' });
        assert.equal(found, true, 'Element was not found');
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

        notFound = await driver.isElementPresent({
          text: 'Lorem ipsum',
          tag: 'span',
        });
        assert.equal(notFound, false, 'Non existent element was found');
      },
    );
  });
});
