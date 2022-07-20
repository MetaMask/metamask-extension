/* eslint-disable mocha/no-skipped-tests */
const { strict: assert } = require('assert');

const {
  convertToHexValue,
  withFixtures,
  getWindowHandles,
} = require('../helpers');

describe.skip('Create token, approve token and approve token without gas', function () {
  describe('Add a custom token from a dapp', function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };

    it('creates, imports and renders the balance for the new token', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: 'connected-state',
          ganacheOptions,
          title: this.test.title,
        },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          // create token
          await driver.openNewPage(`http://127.0.0.1:8080/`);
          await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
          await driver.clickElement({ text: 'Create Token', tag: 'button' });

          const windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindow(windowHandles.popup);
          await driver.clickElement({ text: 'Edit', tag: 'button' });
          const inputs = await driver.findElements('input[type="number"]');
          const gasLimitInput = inputs[0];
          const gasPriceInput = inputs[1];
          await gasLimitInput.fill('4700000');
          await gasPriceInput.fill('20');
          await driver.waitForSelector({ text: 'Save', tag: 'button' });
          await driver.clickElement({ text: 'Save', tag: 'button' });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindow(windowHandles.dapp);

          const tokenContractAddress = await driver.waitForSelector({
            css: '#tokenAddress',
            text: '0x',
          });
          const tokenAddress = await tokenContractAddress.getText();

          // imports custom token from extension
          await driver.switchToWindow(windowHandles.extension);
          await driver.clickElement(`[data-testid="home__asset-tab"]`);
          await driver.clickElement({ tag: 'button', text: 'Assets' });

          await driver.clickElement({ text: 'import tokens', tag: 'a' });
          await driver.clickElement({
            text: 'Custom Token',
            tag: 'button',
          });
          await driver.waitForSelector('#custom-address');
          await driver.fill('#custom-address', tokenAddress);
          await driver.waitForSelector('#custom-symbol');
          await driver.waitForSelector('#custom-decimals');
          await driver.delay(2000);

          await driver.clickElement({
            text: 'Add Custom Token',
            tag: 'button',
          });

          await driver.delay(2000);
          await driver.clickElement({
            text: 'Import Tokens',
            tag: 'button',
          });

          // renders balance for newly created token
          await driver.waitForSelector('.app-header__logo-container');
          await driver.clickElement('.app-header__logo-container');
          await driver.clickElement({ tag: 'button', text: 'Assets' });
          const asset = await driver.waitForSelector({
            css: '.asset-list-item__token-value',
            text: '10',
          });
          assert.equal(await asset.getText(), '10');
        },
      );
    });
  });

  describe('Approves a custom token from dapp', function () {
    let windowHandles;

    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    it('approves an already created token and displays the token approval data', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: 'connected-state',
          ganacheOptions,
          title: this.test.title,
        },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          await driver.openNewPage(`http://127.0.0.1:8080/`);

          await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
          await driver.clickElement({ text: 'Create Token', tag: 'button' });
          windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindow(windowHandles.popup);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.switchToWindow(windowHandles.dapp);
          await driver.waitForSelector({
            text: 'Approve Tokens',
            tag: 'button',
          });
          await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });

          // displays the token approval data
          // switch to popup
          windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindow(windowHandles.popup);

          const functionType = await driver.findElement(
            '.confirm-approve-content__data .confirm-approve-content__small-text',
          );

          await driver.scrollToElement(functionType);
          const functionTypeText = await functionType.getText();
          assert.equal(functionTypeText, 'Function: Approve');
          const confirmDataDiv = await driver.findElement(
            '.confirm-approve-content__data__data-block',
          );
          const confirmDataText = await confirmDataDiv.getText();
          assert(
            confirmDataText.match(
              /0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef4/u,
            ),
          );
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.switchToWindow(windowHandles.extension);
          await driver.clickElement({ tag: 'button', text: 'Activity' });

          await driver.wait(async () => {
            const pendingTxes = await driver.findElements(
              '.transaction-list-item',
            );
            return pendingTxes.length === 2;
          }, 10000);

          await driver.waitForSelector({
            // Selects only the very first transaction list item immediately following the 'Pending' header
            css:
              '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
            text: 'Approve Token spend limit',
          });
        },
      );
    });

    it('customizes gas, edit permissions and checks transaction in transaction list', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: 'connected-state',
          ganacheOptions,
          title: this.test.title,
        },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          await driver.openNewPage(`http://127.0.0.1:8080/`);

          await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
          await driver.clickElement({ text: 'Create Token', tag: 'button' });
          windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindow(windowHandles.popup);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindow(windowHandles.dapp);

          await driver.waitForSelector({
            text: 'Approve Tokens',
            tag: 'button',
          });
          await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });

          // switch to popup
          windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindow(windowHandles.popup);

          await driver.clickElement(
            '.confirm-approve-content__small-blue-text',
          );
          await driver.clickElement(
            { text: 'Edit suggested gas fee', tag: 'button' },
            10000,
          );
          const [gasLimitInput, gasPriceInput] = await driver.findElements(
            'input[type="number"]',
          );
          await gasPriceInput.clear();
          await gasPriceInput.fill('10');
          await gasLimitInput.clear();
          await gasLimitInput.fill('60001');
          await driver.findClickableElement({ text: 'Save', tag: 'button' });
          await driver.clickElement({ text: 'Save', tag: 'button' });

          await driver.waitForSelector({
            css:
              '.confirm-approve-content__transaction-details-content__secondary-fee',
            text: '0.0006 ETH',
          });

          // edits the permission
          const editButtons = await driver.findClickableElements(
            '.confirm-approve-content__small-blue-text',
          );
          await editButtons[2].click();

          // wait for permission modal to be visible
          const permissionModal = await driver.findVisibleElement(
            'span .modal',
          );
          const radioButtons = await driver.findClickableElements(
            '.edit-approval-permission__edit-section__radio-button',
          );
          const customSpendLimit = await radioButtons[1];
          await customSpendLimit.click();
          await driver.fill('input', '5');
          await driver.clickElement({ text: 'Save', tag: 'button' });

          // wait for permission modal to be removed from DOM.
          await permissionModal.waitForElementState('hidden');
          const permissionInfo = await driver.findElements(
            '.confirm-approve-content__medium-text',
          );
          const amountDiv = permissionInfo[0];
          assert.equal(await amountDiv.getText(), '5 TST');

          // submits the transaction
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          // finds the transaction in transaction list
          await driver.switchToWindow(windowHandles.extension);
          await driver.clickElement({ tag: 'button', text: 'Activity' });
          await driver.waitForSelector({
            // Select only the heading of the first entry in the transaction list.
            css:
              '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
            text: 'Approve Token spend limit',
          });
        },
      );
    });
  });

  describe('Approves a custom token from dapp when no gas value is specified', function () {
    let windowHandles;

    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };

    it('approves an already created token, shows the correct recipient, submits the transaction and finds the transaction in the transactions list', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: 'connected-state',
          ganacheOptions,
          title: this.test.title,
        },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          await driver.openNewPage(`http://127.0.0.1:8080/`);

          await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
          await driver.clickElement({ text: 'Create Token', tag: 'button' });
          windowHandles = await getWindowHandles(driver, 3);
          await driver.switchToWindow(windowHandles.popup);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindow(windowHandles.dapp);

          await driver.clickElement({
            text: 'Approve Tokens Without Gas',
            tag: 'button',
          });

          await driver.switchToWindow(windowHandles.extension);
          await driver.clickElement({ tag: 'button', text: 'Activity' });

          await driver.wait(async () => {
            const pendingTxes = await driver.findElements(
              '.transaction-list__pending-transactions .transaction-list-item',
            );
            return pendingTxes.length === 1;
          }, 10000);

          await driver.waitForSelector({
            // Selects only the very first transaction list item immediately following the 'Pending' header
            css:
              '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
            text: 'Approve Token spend limit',
          });

          await driver.clickElement('.transaction-list-item');

          const permissionInfo = await driver.findElements(
            '.confirm-approve-content__medium-text',
          );
          const recipientDiv = permissionInfo[1];
          assert.equal(await recipientDiv.getText(), '0x2f318C33...C970');

          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.waitForSelector({
            css:
              '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
            text: 'Approve Token spend limit',
          });
        },
      );
    });
  });
});
