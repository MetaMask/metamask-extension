const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

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
  const hexPrefixedAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
  const nonHexPrefixedAddress = hexPrefixedAddress.substring(2);
  it('should ensure the address is prefixed with 0x when pasted and should send to a valid hexadecimal address', async function () {
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
  it('should ensure the address is prefixed with 0x when typed and should send to a valid hexadecimal address', async function () {
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
