const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  connectDappWithExtensionPopup,
  getWindowHandles,
} = require('../helpers');

describe('Send token from inside MetaMask', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('starts to send a transaction, transitions to the confirm screen, displays the token transfer data, customizes gas, submits the transaction, finds the transaction in the transactions list', async function () {
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

        await connectDappWithExtensionPopup(driver);
        // create token
        await driver.waitForSelector({ text: 'Create Token', tag: 'button' });
        await driver.clickElement({ text: 'Create Token', tag: 'button' });

        let windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.switchToWindow(windowHandles.dapp);

        await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });

        await driver.waitForSelector({
          text: 'Add Token to Wallet',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Add Token to Wallet',
          tag: 'button',
        });

        windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);
        await driver.clickElement({ text: 'Add Token', tag: 'button' });

        await driver.switchToWindow(windowHandles.extension);

        const assets = await driver.waitForSelector({
          css: '.list-item',
          text: '10 TST',
        });
        assets.click();

        await driver.waitForSelector('[data-testid="eth-overview-send"]');
        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await driver.fill('.unit-input__input', '1');
        // Continue to next screen
        const nextButton = await driver.findClickableElement({
          text: 'Next',
          tag: 'button',
        });
        nextButton.click();
        await driver.clickElement({ text: 'Hex', tag: 'button' });

        const functionType = await driver.findElement(
          '.confirm-page-container-content__function-type',
        );
        const functionTypeText = await functionType.getText();
        assert(functionTypeText.match('Transfer'));

        const tokenAmount = await driver.findElement(
          '.confirm-page-container-summary__title-text',
        );

        const tokenAmountText = await tokenAmount.getText();
        assert.equal(tokenAmountText, '1 TST');

        const confirmDataDiv = await driver.findElement(
          '.confirm-page-container-content__data-box',
        );
        const confirmDataText = await confirmDataDiv.getText();
        assert(
          confirmDataText.match(
            /0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97/u,
          ),
        );
        await driver.clickElement({ text: 'Details', tag: 'button' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        const inputs = await driver.findElements('input[type="number"]');
        const gasLimitInput = inputs[0];
        const gasPriceInput = inputs[1];
        await gasLimitInput.fill('100000');
        await gasPriceInput.fill('100');
        await driver.clickElement({ text: 'Save', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitForSelector(
          {
            css:
              '.transaction-list__completed-transactions .transaction-list-item__primary-currency',
            text: '-1 TST',
          },
          { timeout: 10000 },
        );
        await driver.waitForSelector({
          css: '.list-item__heading',
          text: 'Send TST',
        });
      },
    );
  });
});
