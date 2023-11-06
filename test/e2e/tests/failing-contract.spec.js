const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Failing contract interaction ', function () {
  const ganacheOptions = {
    hardfork: 'london',
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should display a warning when the contract interaction is expected to fail', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
<<<<<<< HEAD
        title: this.test.title,
=======
        smartContract,
        title: this.test.fullTitle(),
>>>>>>> upstream/multichain-swaps-controller
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // deploy contract
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#deployFailingButton');
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
        const completedTx = await driver.findElement('.list-item__title');
        const completedTxText = await completedTx.getText();
        assert.equal(completedTxText, 'Contract Deployment');

        // calls failing contract method
        await driver.switchToWindow(dapp);
        await driver.clickElement('#sendFailingButton');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // display warning when transaction is expected to fail
        const warningText =
          'This transaction is expected to fail. Trying to execute it is expected to be expensive but fail, and is not recommended.';
        const warning = await driver.findElement(
          '.actionable-message__message',
        );
        const confirmButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await warning.getText(), warningText);
        assert.equal(await confirmButton.isEnabled(), false);

        // dismiss warning and confirm the transaction
        await driver.clickElement({ text: 'I will try anyway', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(2)',
          { timeout: 10000 },
        );

        // display the transaction status
        const transactionStatus = await driver.findElement(
<<<<<<< HEAD
          '.transaction-list-item:nth-of-type(1) .transaction-status',
=======
          '.activity-list-item:nth-of-type(1) .transaction-status-label',
        );
        assert.equal(await transactionStatus.getText(), 'Failed');
      },
    );
  });
});

describe('Failing contract interaction on non-EIP1559 network', function () {
  const smartContract = SMART_CONTRACTS.FAILING;
  const ganacheOptions = {
    hardfork: 'berlin',
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should display a warning when the contract interaction is expected to fail', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver, contractAddress);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        // waits for deployed contract and calls failing contract method
        await driver.findClickableElement('#deployButton');

        await driver.fill('#toInput', contractAddress);
        await driver.fill('#amountInput', '0');
        await driver.fill('#gasInput', '100');

        await driver.clickElement('#submitForm');

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        // display warning when transaction is expected to fail
        const warningText =
          'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.';
        const warning = await driver.findElement('.mm-banner-alert .mm-text');
        const confirmButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await warning.getText(), warningText);
        assert.equal(await confirmButton.isEnabled(), false);

        // dismiss warning and confirm the transaction
        await driver.clickElement({
          text: 'I want to proceed anyway',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );

        // display the transaction status
        const transactionStatus = await driver.findElement(
          '.activity-list-item:nth-of-type(1) .transaction-status-label',
>>>>>>> upstream/multichain-swaps-controller
        );
        assert.equal(await transactionStatus.getText(), 'Failed');
      },
    );
  });
});
