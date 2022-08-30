/* eslint-disable mocha/no-skipped-tests */
const { strict: assert } = require('assert');

const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Create token, approve token and approve token without gas', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('imports and renders the balance for the new token', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );

        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        // imports custom token from extension
        await driver.switchToWindow(extension);
        await driver.clickElement(`[data-testid="home__asset-tab"]`);
        await driver.clickElement({ tag: 'button', text: 'Assets' });

        await driver.clickElement({ text: 'import tokens', tag: 'a' });
        await driver.clickElement({
          text: 'Custom token',
          tag: 'button',
        });
        await driver.fill('#custom-address', contractAddress);
        await driver.waitForSelector('#custom-decimals');
        await driver.delay(2000);

        await driver.clickElement({
          text: 'Add custom token',
          tag: 'button',
        });

        await driver.delay(2000);
        await driver.clickElement({
          text: 'Import tokens',
          tag: 'button',
        });

        // renders balance for newly created token
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

  it('approves an already created token and displays the token approval data', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );

        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        await driver.findClickableElement('#deployButton');
        // approve token from dapp
        await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });

        // checks elements on approve token popup
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
        await driver.switchToWindow(extension);
        await driver.clickElement({ tag: 'button', text: 'Activity' });

        // check list of pending transactions in extension
        await driver.wait(async () => {
          const pendingTxes = await driver.findElements(
            '.transaction-list-item',
          );
          return pendingTxes.length === 1;
        }, 10000);

        const approveTokenTask = await driver.waitForSelector({
          // Selects only the very first transaction list item immediately following the 'Pending' header
          css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
          text: 'Approve Token spend limit',
        });
        assert.equal(
          await approveTokenTask.getText(),
          'Approve Token spend limit',
        );
      },
    );
  });

  it('customizes gas, edit permissions and checks transaction in transaction list', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // create token
        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );

        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        await driver.findClickableElement('#deployButton');

        // approve token from dapp
        await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });

        // check elements on approve token popup
        await driver.clickElement('.confirm-approve-content__small-blue-text');
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
        await driver.clickElement({ text: 'Save', tag: 'button' });

        await driver.waitForSelector({
          css: '.confirm-approve-content__transaction-details-content__secondary-fee',
          text: '0.0006 ETH',
        });

        // edits the permission
        const editButtons = await driver.findClickableElements(
          '.confirm-approve-content__small-blue-text',
        );
        await editButtons[2].click();

        // wait for permission modal to be visible
        const permissionModal = await driver.findVisibleElement('span .modal');
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
        await driver.switchToWindow(extension);
        await driver.clickElement({ tag: 'button', text: 'Activity' });
        const approveTokenTask = await driver.waitForSelector({
          // Select only the heading of the first entry in the transaction list.
          css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
          text: 'Approve Token spend limit',
        });
        assert.equal(
          await approveTokenTask.getText(),
          'Approve Token spend limit',
        );
      },
    );
  });

  it('approves an already created token, shows the correct recipient, submits the transaction and finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage(
          `http://127.0.0.1:8080/?contract=${contractAddress}`,
        );
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        await driver.findClickableElement('#deployButton');
        await driver.clickElement({
          text: 'Approve Tokens Without Gas',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });

        const permissionInfo = await driver.findElements(
          '.confirm-approve-content__medium-text',
        );
        const recipientDiv = permissionInfo[1];
        assert.equal(await recipientDiv.getText(), '0x2f318C33...C970');

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(extension);
        await driver.clickElement({ tag: 'button', text: 'Activity' });

        // check pending transaction in extension
        await driver.wait(async () => {
          const pendingTxes = await driver.findElements(
            '.transaction-list__pending-transactions .transaction-list-item',
          );
          return pendingTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          // Selects only the very first transaction list item immediately following the 'Pending' header
          css: '.transaction-list__pending-transactions .transaction-list__header + .transaction-list-item .list-item__heading',
          text: 'Approve Token spend limit',
        });

        const approveTokenTask = await driver.waitForSelector({
          css: '.transaction-list__completed-transactions .transaction-list-item:first-child .list-item__heading',
          text: 'Approve Token spend limit',
        });

        assert.equal(
          await approveTokenTask.getText(),
          'Approve Token spend limit',
        );
      },
    );
  });
});
