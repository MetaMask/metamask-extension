import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { SWAPS_API_V2_BASE_URL } from '../../../../shared/constants/swaps';
import { generateGanacheOptions } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { SWAP_SEND_QUOTES_RESPONSE_ETH_TST } from './mocks/eth-data';

export const NATIVE_TOKEN_SYMBOL = 'ETH';

export class SwapSendPage {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  driver: any;

  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(driver: any) {
    this.driver = driver;
  }

  fillRecipientAddressInput = async (address: string) => {
    await this.driver.fill(
      'input[placeholder="Enter public address (0x) or ENS name"]',
      address,
    );
  };

  searchAndSelectToken = async (
    symbol: string,
    location: 'src' | 'dest' = 'src',
  ) => {
    const isDest = location === 'dest';
    const buttons = await this.driver.findElements(
      '[data-testid="asset-picker-button"]',
    );
    const indexOfButtonToClick = isDest ? 1 : 0;
    await buttons[indexOfButtonToClick].click();

    // Clear search input
    const searchInputField = await this.driver.waitForSelector(
      '[data-testid="asset-picker-modal-search-input"]',
    );
    const searchValue = await searchInputField.getProperty('value');
    if (searchValue) {
      const clearButton = await this.driver.findElement(
        '[data-testid="text-field-search-clear-button"]',
      );
      if (clearButton) {
        await clearButton.click();
      }
    }

    for (const i of symbol) {
      const f = await this.driver.waitForSelector(
        '[data-testid="asset-picker-modal-search-input"]',
      );
      await f.press(i);
    }
    // Verify that only matching tokens are listed
    assert.equal(
      (
        await this.driver.findElements(
          '[data-testid="multichain-token-list-item"]',
        )
      ).length,
      1,
    );
    await this.driver.clickElement({
      css: '[data-testid="multichain-token-list-item"]',
      text: symbol,
    });
    assert.equal(
      (
        await this.driver.findClickableElements({
          css: '[data-testid="asset-picker-button"]',
          text: symbol,
        })
      ).length,
      isDest ? 1 : 2,
    );
  };

  verifyAssetSymbolsAndAmounts = async (
    expectedAssetSymbols: string[],
    expectedInputValues: string[],
    delayInMs = 0,
  ) => {
    await this.driver.delay(1000);
    const assetPickers = await this.driver.findElements(
      '[data-testid="asset-picker-button"]',
    );
    assert.equal(assetPickers.length, 2);
    assert.ok(
      (await assetPickers[0].getText()).includes(expectedAssetSymbols[0]),
    );
    assert.ok(
      (await assetPickers[1].getText()).includes(expectedAssetSymbols[1]),
    );
    assert.ok(await assetPickers[1].getText(), expectedAssetSymbols[1]);

    const inputAmounts = await this.driver.findElements('.asset-picker-amount');
    assert.equal(inputAmounts.length, 2);
    await Promise.all(
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputAmounts.map(async (e: any, index: number) => {
        await this.driver.delay(delayInMs);
        const i = await this.driver.findNestedElement(e, 'input');
        assert.ok(i);
        const v = await i.getProperty('value');
        assert.equal(v, expectedInputValues[index]);
        if (index > 0) {
          const isDisabled = await i.getProperty('disabled');
          assert.equal(isDisabled, true);
        }
      }),
    );
  };

  fillAmountInput = async (amount: string) => {
    await this.driver.waitForSelector('[data-testid="currency-input"]');
    await this.driver.fill('[data-testid="currency-input"]', amount);
  };

  verifyMaxButtonClick = async (
    expectedAssetSymbols: string[],
    expectedInputValues: string[],
  ) => {
    const maxButton = await this.driver.findElement(
      '[data-testid="max-clear-button"]',
    );
    assert.equal(await maxButton.getText(), 'Max');
    await maxButton.click();
    await this.verifyAssetSymbolsAndAmounts(
      expectedAssetSymbols,
      expectedInputValues,
    );

    const clearButton = await this.driver.findElement(
      '[data-testid="max-clear-button"]',
    );
    assert.equal(await clearButton.getText(), 'Clear');
    await clearButton.click();
    await this.verifyAssetSymbolsAndAmounts(expectedAssetSymbols, ['0', '0']);
  };

  switchPrimaryCurrency = async (
    initialParams: string[][],
    _expectedParams: string[][],
  ) => {
    await this.verifyAssetSymbolsAndAmounts(initialParams[0], initialParams[1]);

    // TODO click currency switch button
    // data-testid="currency-swap"

    // await this.verifyAssetSymbolsAndAmounts(
    //   expectedParams[0],
    //   expectedParams[1],
    // );
  };

  verifySwitchPrimaryCurrency = async (
    initialParams: string[][],
    expectedParams: string[][],
  ) => {
    await this.switchPrimaryCurrency(initialParams, expectedParams);
    // TODO uncomment these
    // await this.switchPrimaryCurrency(expectedParams, initialParams);
    // await this.switchPrimaryCurrency(initialParams, expectedParams);
    // await this.switchPrimaryCurrency(expectedParams, initialParams);
  };

  verifyQuoteDisplay = async (
    exepectedQuoteRate: string,
    expectedGasFee: string,
    expectedGasFeeInFiat: string,
  ) => {
    // TODO verify that swaps was only called once
    const quoteRate = await this.driver.findElement(
      '[data-testid="quote-card__conversion-rate"]',
    );
    assert.ok(quoteRate);
    assert.equal(await quoteRate.getText(), exepectedQuoteRate);

    const gasFee = await this.driver.findElement(
      '[data-testid="quote-card__gas-fee"]',
    );
    assert.ok(gasFee);
    assert.equal(await gasFee.getText(), expectedGasFee);

    const gasFeeInFiat = await this.driver.findElement(
      '[data-testid="quote-card__fiat-gas-fee"]',
    );
    assert.ok(gasFeeInFiat);
    assert.equal(await gasFeeInFiat.getText(), expectedGasFeeInFiat);
  };

  verifyHistoryEntry = async (
    expectedLabel: string,
    expectedStatus: 'Queued' | 'Pending' | 'Confirmed',
    expectedTokenChange?: string,
    expectedFiatChange?: string,
  ) => {
    // TODO loop through entries by the same confirmation
    const status = await this.driver.findElement(
      `.transaction-status-label--${expectedStatus.toLowerCase()}`,
    );
    assert.ok(status);
    assert.equal(await status.getText(), expectedStatus);

    const label = await this.driver.findElement(
      '[data-testid="activity-list-item-action"',
    );
    assert.ok(label);
    assert.equal(await label.getText(), expectedLabel);

    if (expectedTokenChange) {
      const tokenChange = await this.driver.findElement(
        '[data-testid="transaction-list-item-primary-currency"]',
      );
      assert.ok(tokenChange);
      assert.equal(await tokenChange.getText(), expectedTokenChange);
    }

    if (expectedFiatChange) {
      const fiatChange = await this.driver.findElement(
        '[data-testid="transaction-list-item-secondary-currency"]',
      );
      assert.ok(fiatChange);
      assert.equal(await fiatChange.getText(), expectedFiatChange);
    }

    // TODO verify expanded activity details
  };

  submitSwap = async () => {
    await (
      await this.driver.findClickableElement({
        text: 'Confirm',
        tag: 'button',
      })
    ).click();
  };
}

export const mockSwapsApi =
  (quotes: typeof SWAP_SEND_QUOTES_RESPONSE_ETH_TST, query: string) =>
  async (mockServer: Mockttp) => {
    await mockServer
      .forGet(`${SWAPS_API_V2_BASE_URL}/v2/networks/1337/quotes`)
      .withExactQuery(query)
      .always()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: quotes,
        };
      });
  };

export const getSwapSendFixtures = (
  title?: string,
  swapsQuotes = SWAP_SEND_QUOTES_RESPONSE_ETH_TST,
  swapsQuery = '?sourceAmount=1000000000000000000&sourceToken=0x0000000000000000000000000000000000000000&destinationToken=0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947&sender=0x5cfe73b6021e818b776b421b1c4db2474086a7e1&recipient=0xc427D562164062a23a5cFf596A4a3208e72Acd28&slippage=2',
) => {
  const ETH_CONVERSION_RATE_USD = 3010;
  return {
    driverOptions: { responsive: true },
    fixtures: new FixtureBuilder()
      .withPreferencesController({
        featureFlags: {},
        preferences: { showFiatInTestnets: true },
      })
      .withCurrencyController({
        currencyRates: {
          [NATIVE_TOKEN_SYMBOL]: {
            conversionDate: 1665507609.0,
            conversionRate: ETH_CONVERSION_RATE_USD,
            usdConversionRate: ETH_CONVERSION_RATE_USD,
          },
        },
      })
      // TODO fix TST exchange rate (not visible atm)
      // Note: The token rates controller has deprecated `contractExchangeRates` in favor of
      //       a new `marketData` structure.  See https://github.com/MetaMask/core/pull/4206
      //
      // .withTokenRatesController({
      //   contractExchangeRates: {
      //     '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947':
      //       1 / ETH_CONVERSION_RATE_USD,
      //   },
      // })
      .withTokensControllerERC20()
      .withPreferencesControllerPetnamesDisabled()
      .build(),
    smartContract: SMART_CONTRACTS.HST,
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    testSpecificMock: mockSwapsApi(swapsQuotes, swapsQuery),
    ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
    title,
  };
};
