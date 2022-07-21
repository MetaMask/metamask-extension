const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

const hexPrefixedAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const nonHexPrefixedAddress = hexPrefixedAddress.substring(2);

describe('Send ETH to a 40 character hexadecimal address', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should ensure the address is prefixed with 0x when pasted and should send ETH to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Send ETH
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Paste address without hex prefix
        await driver.pasteIntoField(
          'input[placeholder="Search, public address (0x), or ENS"]',
          nonHexPrefixedAddress,
        );
        await driver.waitForSelector({
          css: '.ens-input__selected-input__title',
          text: hexPrefixedAddress,
        });
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // Confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement('[data-testid="home__activity-tab"]');
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        await driver.clickElement('.sender-to-recipient__name:nth-of-type(2)');

        // Verify address in activity log
        const publicAddress = await driver.findElement(
          '.nickname-popover__public-address',
        );
        assert.equal(await publicAddress.getText(), hexPrefixedAddress);
      },
    );
  });
  it('should ensure the address is prefixed with 0x when typed and should send ETH to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Send ETH
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Type address without hex prefix
        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          nonHexPrefixedAddress,
        );
        await driver.waitForSelector({
          css: '.ens-input__selected-input__title',
          text: hexPrefixedAddress,
        });
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // Confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement('[data-testid="home__activity-tab"]');
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        await driver.clickElement('.sender-to-recipient__name:nth-of-type(2)');

        // Verify address in activity log
        const publicAddress = await driver.findElement(
          '.nickname-popover__public-address',
        );
        assert.equal(await publicAddress.getText(), hexPrefixedAddress);
      },
    );
  });
});

describe('Send ERC20 to a 40 character hexadecimal address', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should ensure the address is prefixed with 0x when pasted and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Create TST
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#createToken');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );

        // Add token
        await driver.switchToWindow(dapp);
        await driver.clickElement('#watchAsset');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add Token', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // Send TST
        await driver.clickElement('[data-testid="home__asset-tab"]');
        await driver.clickElement('.token-cell');
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Paste address without hex prefix
        await driver.pasteIntoField(
          'input[placeholder="Search, public address (0x), or ENS"]',
          nonHexPrefixedAddress,
        );
        await driver.waitForSelector({
          css: '.ens-input__selected-input__title',
          text: hexPrefixedAddress,
        });
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);
        await driver.delay(2000);
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // Confirm transaction
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__title',
          text: '0 TST',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
          { timeout: 10000 },
        );
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        await driver.clickElement('.sender-to-recipient__name:nth-of-type(2)');

        // Verify address in activity log
        const publicAddress = await driver.findElement(
          '.nickname-popover__public-address',
        );
        assert.equal(await publicAddress.getText(), hexPrefixedAddress);
      },
    );
  });
  it('should ensure the address is prefixed with 0x when typed and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Create TST
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#createToken');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          { timeout: 10000 },
        );

        // Add token
        await driver.switchToWindow(dapp);
        await driver.clickElement('#watchAsset');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add Token', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // Send TST
        await driver.clickElement('[data-testid="home__asset-tab"]');
        await driver.clickElement('.token-cell');
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Type address without hex prefix
        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          nonHexPrefixedAddress,
        );
        await driver.waitForSelector({
          css: '.ens-input__selected-input__title',
          text: hexPrefixedAddress,
        });
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);
        await driver.delay(2000);
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // Confirm transaction
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__title',
          text: '0 TST',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
          { timeout: 10000 },
        );
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        await driver.clickElement('.sender-to-recipient__name:nth-of-type(2)');

        // Verify address in activity log
        const publicAddress = await driver.findElement(
          '.nickname-popover__public-address',
        );
        assert.equal(await publicAddress.getText(), hexPrefixedAddress);
      },
    );
  });
});
