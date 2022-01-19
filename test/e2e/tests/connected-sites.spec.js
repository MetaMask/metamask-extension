const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Disconnect single connected account', function () {
  let windowHandles;
  let extension;
  let popup;
  let dapp;
  it('should disconnect the single connected account from the dapp', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-sites',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open dapp
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];
        dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        popup = windowHandles.find(
          (handle) => handle !== extension && handle !== dapp,
        );

        // Connect to Account 1
        await driver.switchToWindow(popup);
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.waitForSelector({
          css: '.permissions-connect-header__title',
          text: 'Connect to Account 1',
        });
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(dapp);
        await driver.waitForSelector({
          css: '#accounts',
          text: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
        });

        // Open connected sites popover
        await driver.switchToWindow(extension);
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__connected-sites"]',
        );
        await driver.waitForSelector({
          css: '.connected-sites-list__subject-name',
          text: '127.0.0.1:8080',
        });

        // Disconnect from dapp
        await driver.clickElement('i[title="Disconnect"]');
        await driver.clickElement({ text: 'Disconnect', tag: 'button' });

        await driver.switchToWindow(dapp);
        const accountLabel = await driver.findElement('#accounts');
        assert.equal(await accountLabel.getText(), '');
      },
    );
  });
});

describe('Disconnect 1 of 3 connected accounts', function () {
  let windowHandles;
  let extension;
  let popup;
  let dapp;
  it('should disconnect 1 of 3 connected accounts from the dapp', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-sites',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open dapp
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];
        dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        popup = windowHandles.find(
          (handle) => handle !== extension && handle !== dapp,
        );

        // Connect to all your accounts
        await driver.switchToWindow(popup);
        await driver.waitForSelector('input[type="checkbox"]');
        await driver.clickElement('input[type="checkbox"]');
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.waitForSelector({
          css: '.permissions-connect-header__title',
          text: 'Connect to all your accounts',
        });
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(dapp);
        await driver.waitForSelector({
          css: '#accounts',
          text: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
        });

        // Open connected sites popover
        await driver.switchToWindow(extension);
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__connected-sites"]',
        );
        await driver.waitForSelector({
          css: '.connected-sites-list__subject-name',
          text: '127.0.0.1:8080',
        });

        // Disconnect from dapp
        await driver.clickElement('i[title="Disconnect"]');
        await driver.clickElement({ text: 'Disconnect', tag: 'button' });

        await driver.switchToWindow(dapp);
        const accountLabel = await driver.findElement('#accounts');
        assert.equal(
          await accountLabel.getText(),
          '0xd38d853771fb546bd8b18b2f3638491bc0b0e906',
        );
      },
    );
  });
});

describe('Disconnect all accounts', function () {
  let windowHandles;
  let extension;
  let popup;
  let dapp;
  it('should disconnect 3 of 3 connected accounts from the dapp', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-sites',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open dapp
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];
        dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        popup = windowHandles.find(
          (handle) => handle !== extension && handle !== dapp,
        );

        // Connect to all your accounts
        await driver.switchToWindow(popup);
        await driver.waitForSelector('input[type="checkbox"]');
        await driver.clickElement('input[type="checkbox"]');
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.waitForSelector({
          css: '.permissions-connect-header__title',
          text: 'Connect to all your accounts',
        });
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(dapp);
        await driver.waitForSelector({
          css: '#accounts',
          text: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
        });

        // Open connected sites popover
        await driver.switchToWindow(extension);
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__connected-sites"]',
        );
        await driver.waitForSelector({
          css: '.connected-sites-list__subject-name',
          text: '127.0.0.1:8080',
        });

        // Disconnect all accounts
        await driver.clickElement('i[title="Disconnect"]');
        await driver.clickElement({
          text: 'Disconnect all accounts',
          tag: 'a',
        });

        await driver.switchToWindow(dapp);
        const accountLabel = await driver.findElement('#accounts');
        assert.equal(await accountLabel.getText(), '');
      },
    );
  });
});