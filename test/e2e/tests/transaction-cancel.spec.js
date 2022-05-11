const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Cancel transaction', function () {
  it('can cancel a transaction', async function () {
    const ganacheOptions = {
      blockTime: 30,
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      { fixtures: 'imported-account', ganacheOptions, title: this.test.title },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // Send transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          '[data-testid="ens-input"]',
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await driver.fill('.unit-input__input', '1');
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.000042 ETH',
        });
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        // Cancel transaction
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.findElement('.transaction-list-item');
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        const [gasLimit, gasPrice] = await driver.findElements(
          'input[type="number"]',
        );
        await gasLimit.fill('21000');
        await gasPrice.fill('9');
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.000189 ETH',
        });
        await driver.clickElement({ text: 'Save', tag: 'button' });
        // Verify transaction in activity log
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item',
          { timeout: 30000 },
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        const [
          createdActivity,
          submittedActivity,
          cancelAttemptedActivity,
          cancelledActivity,
        ] = await driver.findElements('.transaction-activity-log__activity');
        const transactionStatus = await driver.findElement(
          '.transaction-list-item-details .transaction-status',
        );
        assert.equal(await transactionStatus.getText(), 'Cancelled');
        assert.match(
          await createdActivity.getText(),
          /Transaction created with a value of 1 ETH at/u,
        );
        assert.match(
          await submittedActivity.getText(),
          /Transaction submitted with estimated gas fee of 42000 GWEI at/u,
        );
        assert.match(
          await cancelAttemptedActivity.getText(),
          /Transaction cancel attempted with estimated gas fee of 189000 GWEI at/u,
        );
        assert.match(
          await cancelledActivity.getText(),
          /Transaction successfully cancelled at/u,
        );
      },
    );
  });

  it('can cancel a transaction - EIP1559', async function () {
    const ganacheOptions = {
      blockTime: 30,
      hardfork: 'london',
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      { fixtures: 'imported-account', ganacheOptions, title: this.test.title },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // Send transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          '[data-testid="ens-input"]',
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await driver.fill('.unit-input__input', '1');
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.00044ETH',
        });
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        // Cancel transaction
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.findElement('.transaction-list-item');
        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        const [
          gasLimitInput,
          maxPriorityFeeInput,
          maxFeeInput,
        ] = await driver.findElements('input[type="number"]');
        await gasLimitInput.fill('21000');
        await maxPriorityFeeInput.fill('2');
        await maxFeeInput.fill('29');
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.00045033 ETH',
        });
        await driver.clickElement({ text: 'Save', tag: 'button' });
        // Verify transaction in activity log
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item',
          { timeout: 30000 },
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        const [
          createdActivity,
          submittedActivity,
          cancelAttemptedActivity,
          cancelledActivity,
        ] = await driver.findElements('.transaction-activity-log__activity');
        const transactionStatus = await driver.findElement(
          '.transaction-list-item-details .transaction-status',
        );
        assert.equal(await transactionStatus.getText(), 'Cancelled');
        assert.match(
          await createdActivity.getText(),
          /Transaction created with a value of 1 ETH at/u,
        );
        assert.match(
          await submittedActivity.getText(),
          /Transaction submitted with estimated gas fee of 439833.159 GWEI at/u,
        );
        assert.match(
          await cancelAttemptedActivity.getText(),
          /Transaction cancel attempted with estimated gas fee of 450333.159 GWEI at/u,
        );
        assert.match(
          await cancelledActivity.getText(),
          /Transaction successfully cancelled at/u,
        );
      },
    );
  });
});
