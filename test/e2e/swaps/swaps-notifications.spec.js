const { strict: assert } = require('assert');

const { withFixtures } = require('../helpers');

const { withFixturesOptions, loadExtension, buildQuote } = require('./shared');

describe('Swaps - notifications', function () {
  async function mockTradesApiPriceSlippageError(mockServer) {
    await mockServer
      .forGet('https://swap.metaswap.codefi.network/networks/1/trades')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: [
            {
              trade: {
                data: '0x0',
                from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
                value: '2000000000000000000',
                to: '0x2f318c334780961fb129d2a6c30d0763d9a5c970',
              },
              hasRoute: false,
              sourceAmount: '2000000000000000000',
              destinationAmount: '16521445264052765704984287606833',
              error: null,
              sourceToken: '0x0000000000000000000000000000000000000000',
              destinationToken: '0xc6bdb96e29c38dc43f014eed44de4106a6a8eb5f',
              maxGas: 1000000,
              averageGas: 560305,
              estimatedRefund: 0,
              approvalNeeded: null,
              fetchTime: 312,
              aggregator: 'oneInch',
              aggType: 'AGG',
              fee: 0.875,
              quoteRefreshSeconds: 30,
              gasMultiplier: 1.06,
              sourceTokenRate: 1,
              destinationTokenRate: 3,
              priceSlippage: {
                ratio: -1.14736836569258,
                calculationError: 'error',
                bucket: 'low',
                sourceAmountInETH: 2,
                destinationAmountInETH: 6,
                sourceAmountInNativeCurrency: 2,
                destinationAmountInNativeCurrency: 6,
              },
            },
          ],
        };
      });
  }

  it('tests notifications for verified token on 1 source and price difference', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        testSpecificMock: mockTradesApiPriceSlippageError,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadExtension(driver);
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'INUINU',
        });
        const reviewSwapButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await reviewSwapButton.getText(), 'Review swap');
        assert.equal(await reviewSwapButton.isEnabled(), false);
        const continueButton = await driver.findClickableElement(
          '.actionable-message__action-warning',
        );
        assert.equal(await continueButton.getText(), 'Continue');
        await continueButton.click();
        assert.equal(await reviewSwapButton.isEnabled(), true);
        await reviewSwapButton.click();
        await driver.waitForSelector({
          css: '[class*="box--align-items-center"]',
          text: 'Estimated gas fee',
        });
        const swapButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await swapButton.isEnabled(), false);
        await driver.clickElement({ text: 'I understand', tag: 'button' });
        assert.equal(await swapButton.getText(), 'Swap');
        assert.equal(await swapButton.isEnabled(), true);
      },
    );
  });

  it('tests a notification for not enough balance', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadExtension(driver);
        await buildQuote(driver, {
          amount: 50,
          swapTo: 'USDC',
        });
        const reviewSwapButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await reviewSwapButton.getText(), 'Review swap');
        assert.equal(await reviewSwapButton.isEnabled(), true);
        await reviewSwapButton.click();
        await driver.waitForSelector({
          css: '[class*="box--align-items-center"]',
          text: 'Estimated gas fee',
        });
        await driver.waitForSelector({
          css: '[class*="actionable-message__message"]',
          text: 'You need 43.4467 more TESTETH to complete this swap',
        });
        const swapButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await swapButton.getText(), 'Swap');
        assert.equal(await swapButton.isEnabled(), false);
      },
    );
  });

  it('tests notifications for verified token on 0 sources and high slippage', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadExtension(driver);
        await buildQuote(driver, {
          amount: 2,
          swapToContractAddress: '0x72c9Fb7ED19D3ce51cea5C56B3e023cd918baaDf',
        });
        await driver.waitForSelector({
          css: '.popover-header',
          text: 'Import token?',
        });
        await driver.clickElement(
          '[data-testid="page-container__import-button"]',
        );
        const reviewSwapButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await reviewSwapButton.isEnabled(), false);
        const continueButton = await driver.findClickableElement(
          '.actionable-message__action-danger',
        );
        assert.equal(await continueButton.getText(), 'Continue');
        await continueButton.click();
        assert.equal(await reviewSwapButton.isEnabled(), true);
        await driver.clickElement('[class="slippage-buttons__header-text"]');
        await driver.clickElement({ text: 'custom', tag: 'button' });
        await driver.fill(
          'input[data-testid="slippage-buttons__custom-slippage"]',
          '20',
        );
        await driver.waitForSelector({
          css: '[class*="slippage-buttons__error-text"]',
          text: 'Slippage amount is too high and will result in a bad rate. Please reduce your slippage tolerance to a value below 15%.',
        });
        assert.equal(await reviewSwapButton.isEnabled(), false);
        await driver.fill(
          'input[data-testid="slippage-buttons__custom-slippage"]',
          '4',
        );
        assert.equal(await reviewSwapButton.isEnabled(), true);
      },
    );
  });
});
