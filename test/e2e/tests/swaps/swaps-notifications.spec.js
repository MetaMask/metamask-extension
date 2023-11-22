const { withFixtures, unlockWallet } = require('../../helpers');
const {
  withFixturesOptions,
  buildQuote,
  reviewQuote,
  checkNotification,
} = require('./shared');

describe('Swaps - notifications @no-mmi', function () {
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'INUINU',
        });
        await checkNotification(driver, {
          title: 'Potentially inauthentic token',
          text: 'INUINU is only verified on 1 source. Consider verifying it on Etherscan before proceeding.',
        });
        await driver.clickElement({ text: 'Continue swapping', tag: 'button' });
        await driver.waitForSelector({
          text: 'Swap',
          tag: 'button',
        });
        await checkNotification(driver, {
          title: 'Check your rate before proceeding',
          text: 'Price impact could not be determined due to lack of market price data.',
        });
        await driver.clickElement({ text: 'Swap anyway', tag: 'button' });
        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'TESTETH',
          swapTo: 'INUINU',
          skipCounter: true,
        });
        await driver.findClickableElement({
          text: 'Swap',
          tag: 'button',
        });
      },
    );
  });
  it('tests a notification for not enough balance', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: 50,
          swapTo: 'USDC',
        });
        await checkNotification(driver, {
          title: 'Insufficient balance',
          text: 'You need 43.4467 more TESTETH to complete this swap',
        });
        await reviewQuote(driver, {
          swapFrom: 'TESTETH',
          swapTo: 'USDC',
          amount: 50,
          skipCounter: true,
        });
        await driver.waitForSelector({
          text: 'Swap',
          tag: 'button',
          css: '[disabled]',
        });
      },
    );
  });
  it('tests notifications for token import', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: 2,
          swapToContractAddress: '0x72c9Fb7ED19D3ce51cea5C56B3e023cd918baaDf',
        });
        await driver.clickElement(
          '[data-testid="import-tokens-import-button"]',
        );
        await checkNotification(driver, {
          title: 'Token added manually',
          text: 'Verify this token on Etherscan and make sure it is the token you want to trade.',
        });
      },
    );
  });
  it('tests notifications for slippage', async function () {
    await withFixtures(
      {
        ...withFixturesOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await buildQuote(driver, {
          amount: '.0001',
          swapTo: 'DAI',
        });
        await driver.clickElement('[title="Transaction settings"]');
        await driver.clickElement({ text: 'custom', tag: 'button' });
        await driver.fill('input[data-testid*="slippage"]', '0');
        await checkNotification(driver, {
          title: 'Sourcing zero-slippage providers',
          text: 'There are fewer zero-slippage quote providers which will result in a less competitive quote.',
        });
        await driver.fill('input[data-testid*="slippage"]', '1');
        await checkNotification(driver, {
          title: 'Low slippage',
          text: 'A value this low (1%) may result in a failed swap',
        });
        await driver.fill('input[data-testid*="slippage"]', '15');
        await checkNotification(driver, {
          title: 'High slippage',
          text: 'The slippage entered (15%) is considered very high and may result in a bad rate',
        });
        await driver.fill('input[data-testid*="slippage"]', '20');
        await checkNotification(driver, {
          title: 'Very high slippage',
          text: 'Slippage tolerance must be 15% or less. Anything higher will result in a bad rate.',
        });
      },
    );
  });
});
