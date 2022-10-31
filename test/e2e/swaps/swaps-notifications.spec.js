const { strict: assert } = require('assert');

const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { ganacheOptions, loadSwaps, buildQuote } = require('./shared');

describe('Swaps - notifications', function () {
  it('tests notifications for verified token on 1 source and price difference', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadSwaps(driver);
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

  it('tests notifications for verified token on 0 sources and high slippage', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadSwaps(driver);
        await buildQuote(driver, {
          amount: 2,
          swapTo: '0x72c9Fb7ED19D3ce51cea5C56B3e023cd918baaDf',
        });
        await driver.waitForSelector({
          css: '.popover-header__title',
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

  it('tests a notification for not enough balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await loadSwaps(driver);
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
});
