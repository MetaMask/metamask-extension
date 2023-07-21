const { toHex } = require('@metamask/controller-utils');
const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const {
  withFixtures,
  roundToXDecimalPlaces,
  generateRandNumBetween,
  generateGanacheOptions,
  DEFAULT_GANACHE_OPTIONS,
  generateETHBalance,
  unlockWallet,
  getEventPayloads,
  assertInAnyOrder,
} = require('../helpers');
const {
  buildQuote,
  reviewQuote,
  waitForTransactionToComplete,
  checkActivityTransaction,
  changeExchangeRate,
} = require('../swaps/shared');
const {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} = require('../../../shared/constants/metametrics');
const {
  TOKENS_API_MOCK_RESULT,
  TOP_ASSETS_API_MOCK_RESULT,
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  FEATURE_FLAGS_API_MOCK_RESULT,
  NETWORKS_API_MOCK_RESULT,
  TRADES_API_MOCK_RESULT,
  NETWORKS_2_API_MOCK_RESULT,
} = require('./mock-data');

const numberOfSegmentRequests = 19;

async function mockSegmentAndMetaswapRequests(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ properties: { category: MetaMetricsEventCategory.Swaps } }],
      })
      .times()
      .thenCallback(() => ({ statusCode: 200 })),
    await mockServer
      .forGet('https://swap.metaswap.codefi.network/networks/1/tokens')
      .thenCallback(() => ({ statusCode: 200, json: TOKENS_API_MOCK_RESULT })),
    await mockServer
      .forGet('https://swap.metaswap.codefi.network/networks/1/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: TOP_ASSETS_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet(
        'https://swap.metaswap.codefi.network/networks/1/aggregatorMetadata',
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: AGGREGATOR_METADATA_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://gas-api.metaswap.codefi.network/networks/1/gasPrices')
      .thenCallback(() => ({
        statusCode: 200,
        json: GAS_PRICE_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.metaswap.codefi.network/featureFlags')
      .thenCallback(() => ({
        statusCode: 200,
        json: FEATURE_FLAGS_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://tx-insights.metaswap.codefi.network/networks')
      .thenCallback(() => ({
        statusCode: 200,
        json: NETWORKS_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.metaswap.codefi.network/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: TRADES_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://swap.metaswap.codefi.network/networks/1')
      .thenCallback(() => ({
        statusCode: 200,
        json: NETWORKS_2_API_MOCK_RESULT,
      })),
    await mockServer
      .forGet('https://token-api.metaswap.codefi.network/token/1337')
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}

const initialBalance = roundToXDecimalPlaces(
  generateRandNumBetween(10, 100),
  4,
);

describe('Swap Eth for another Token', function () {
  it('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: generateGanacheOptions({
          accounts: [
            {
              secretKey: DEFAULT_GANACHE_OPTIONS.accounts[0].secretKey,
              balance: generateETHBalance(initialBalance),
            },
          ],
        }),
        title: this.test.title,
        testSpecificMock: mockSegmentAndMetaswapRequests,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();

        await unlockWallet(driver);

        await getQuoteAndSwapTokens(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);

        const numberOfMetaswapRequests = 9;
        assert.equal(
          events.length,
          numberOfSegmentRequests + numberOfMetaswapRequests,
        );

        const reqs = events.slice(0, numberOfSegmentRequests);

        assert.equal(reqs[0].event, MetaMetricsEventName.NavSwapButtonClicked);
        assert.deepStrictEqual(reqs[0].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
          location: 'Main View',
          text: 'Swap',
          token_symbol: 'ETH',
        });

        // reqs[1], reqs[2] sometimes switch order
        const assertionsReq1 = [
          (req) => req.event === MetaMetricsEventName.PrepareSwapPageLoaded,
          (req) => Object.keys(req.properties).length === 7,
          (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
          (req) => req.properties?.chain_id === toHex(1337),
          (req) => req.properties?.current_stx_enabled === false,
          (req) => req.properties?.environment_type === 'fullscreen',
          (req) => req.properties?.is_hardware_wallet === false,
          (req) => req.properties?.locale === 'en',
          (req) => req.properties?.stx_enabled === false,
        ];

        const assertionsReq2 = [
          (req) => req.event === MetaMetricsEventName.PrepareSwapPageLoaded,
          (req) => Object.keys(req.properties).length === 4,
          (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
          (req) => req.properties?.chain_id === toHex(1337),
          (req) => req.properties?.environment_type === 'fullscreen',
          (req) => req.properties?.locale === 'en',
        ];

        assert.ok(
          assertInAnyOrder(
            [reqs[1], reqs[2]],
            [assertionsReq1, assertionsReq2],
          ),
          'requests [1] and [2] did not match what was expected',
        );

        assert.equal(reqs[3].event, MetaMetricsEventName.QuotesRequested);
        assert.deepStrictEqual(reqs[3].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
          anonymizedData: true,
          current_stx_enabled: false,
          custom_slippage: false,
          is_hardware_wallet: false,
          request_type: 'Order',
          slippage: 2,
          stx_enabled: false,
          token_from: 'TESTETH',
          token_from_amount: '2',
          token_to: 'DAI',
        });

        assert.equal(reqs[4].event, MetaMetricsEventName.QuotesRequested);
        assert.deepStrictEqual(reqs[4].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
        });

        // reqs[5], reqs[6], reqs[7] and reqs[8] sometimes switch order
        const assertionsReq5 = [
          (req) => req.event === MetaMetricsEventName.QuotesReceived,
          (req) => Object.keys(req.properties).length === 18,
          (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
          (req) => req.properties.chain_id === toHex(1337),
          (req) => req.properties.environment_type === 'fullscreen',
          (req) => req.properties.locale === 'en',
          (req) => req.properties.anonymizedData === true,
          (req) => typeof req.properties.available_quotes === 'number',
          (req) => typeof req.properties.best_quote_source === 'string',
          (req) => req.properties.current_stx_enabled === false,
          (req) => req.properties.custom_slippage === false,
          (req) => req.properties.is_hardware_wallet === false,
          (req) => req.properties.request_type === 'Order',
          (req) => typeof req.properties.response_time === 'number',
          (req) => req.properties.slippage === 2,
          (req) => req.properties.stx_enabled === false,
          (req) => req.properties.token_from === 'TESTETH',
          (req) => req.properties.token_from_amount === '2',
          (req) => req.properties.token_to === 'DAI',
          (req) => typeof req.properties.token_to_amount === 'string',
        ];

        const assertionsReq6 = [
          (req) => req.event === MetaMetricsEventName.QuotesReceived,
          (req) => Object.keys(req.properties).length === 4,
          (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
          (req) => req.properties?.chain_id === toHex(1337),
          (req) => req.properties?.environment_type === 'fullscreen',
          (req) => req.properties?.locale === 'en',
        ];

        const assertionsReq7 = [
          (req) => req.event === MetaMetricsEventName.BestQuoteReviewed,
          (req) => Object.keys(req.properties).length === 17,
          (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
          (req) => req.properties?.chain_id === toHex(1337),
          (req) => req.properties?.environment_type === 'fullscreen',
          (req) => req.properties?.locale === 'en',
          (req) => typeof req.properties?.available_quotes === 'number',
          (req) => typeof req.properties?.best_quote_source === 'string',
          (req) => req.properties?.current_stx_enabled === false,
          (req) => req.properties?.custom_slippage === false,
          (req) => req.properties?.is_hardware_wallet === false,
          (req) => req.properties?.request_type === false,
          (req) => req.properties?.slippage === 2,
          (req) => req.properties?.stx_enabled === false,
          (req) => req.properties?.token_from === 'TESTETH',
          (req) => req.properties?.token_from_amount === '2',
          (req) => req.properties?.token_to === 'DAI',
          (req) => typeof req.properties?.token_to_amount === 'string',
        ];

        const assertionsReq8 = [
          (req) => req.event === MetaMetricsEventName.BestQuoteReviewed,
          (req) => Object.keys(req.properties).length === 4,
          (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
          (req) => req.properties?.chain_id === toHex(1337),
          (req) => req.properties?.environment_type === 'fullscreen',
          (req) => req.properties?.locale === 'en',
        ];

        assert.ok(
          assertInAnyOrder(
            [reqs[5], reqs[6], reqs[7], reqs[8]],
            [assertionsReq5, assertionsReq6, assertionsReq7, assertionsReq8],
          ),
          'requests [5 to 8] did not match what was expected',
        );

        assert.equal(
          reqs[9].event,
          MetaMetricsEventName.AllAvailableQuotesOpened,
        );
        assert.equal(Object.keys(reqs[9].properties).length, 18);
        assert.equal(
          reqs[9].properties.category,
          MetaMetricsEventCategory.Swaps,
        );
        assert.equal(reqs[9].properties.chain_id, toHex(1337));
        assert.equal(reqs[9].properties.environment_type, 'fullscreen');
        assert.equal(reqs[9].properties.locale, 'en');
        assert.equal(typeof reqs[9].properties.available_quotes, 'number');
        assert.equal(typeof reqs[9].properties.best_quote_source, 'string');
        assert.equal(reqs[9].properties.current_stx_enabled, false);
        assert.equal(reqs[9].properties.custom_slippage, false);
        assert.equal(reqs[9].properties.is_hardware_wallet, false);
        assert.equal(reqs[9].properties.request_type, false);
        assert.equal(reqs[9].properties.slippage, 2);
        assert.equal(reqs[9].properties.stx_enabled, false);
        assert.equal(reqs[9].properties.token_from, 'TESTETH');
        assert.equal(reqs[9].properties.token_from_amount, '2');
        assert.equal(reqs[9].properties.token_to, 'DAI');
        assert.equal(reqs[9].properties.token_to, 'DAI');
        assert.equal(reqs[9].properties.other_quote_selected, false);
        assert.equal(reqs[9].properties.other_quote_selected_source, null);
        assert.equal(typeof reqs[9].properties.token_to_amount, 'string');

        assert.equal(
          reqs[10].event,
          MetaMetricsEventName.AllAvailableQuotesOpened,
        );
        assert.deepStrictEqual(reqs[10].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
        });

        assert.equal(reqs[11].event, MetaMetricsEventName.SwapStarted);
        assert.equal(Object.keys(reqs[11].properties).length, 24);
        assert.equal(reqs[11].properties.token_from, 'TESTETH');
        assert.equal(reqs[11].properties.token_from_amount, '2');
        assert.equal(reqs[11].properties.token_to, 'DAI');
        assert.equal(typeof reqs[11].properties.token_to_amount, 'string');
        assert.equal(reqs[11].properties.slippage, 2);
        assert.equal(reqs[11].properties.custom_slippage, false);
        assert.equal(typeof reqs[11].properties.best_quote_source, 'string');
        assert.equal(
          typeof reqs[11].properties.other_quote_selected,
          'boolean',
        );
        assert.equal(
          typeof reqs[11].properties.other_quote_selected_source,
          'string',
        );
        assert.equal(typeof reqs[11].properties.gas_fees, 'string');
        assert.equal(typeof reqs[11].properties.estimated_gas, 'string');
        assert.equal(typeof reqs[11].properties.suggested_gas_price, 'string');
        assert.equal(reqs[11].properties.is_hardware_wallet, false);
        assert.equal(reqs[11].properties.stx_enabled, false);
        assert.equal(reqs[11].properties.current_stx_enabled, false);
        assert.equal(typeof reqs[11].properties.reg_tx_fee_in_usd, 'number');
        assert.equal(typeof reqs[11].properties.reg_tx_fee_in_eth, 'number');
        assert.equal(
          typeof reqs[11].properties.reg_tx_max_fee_in_usd,
          'number',
        );
        assert.equal(
          typeof reqs[11].properties.reg_tx_max_fee_in_eth,
          'number',
        );
        assert.equal(
          reqs[11].properties.category,
          MetaMetricsEventCategory.Swaps,
        );
        assert.equal(reqs[11].properties.locale, 'en');
        assert.equal(reqs[11].properties.chain_id, toHex(1337));
        assert.equal(reqs[11].properties.environment_type, 'fullscreen');

        assert.equal(reqs[12].event, MetaMetricsEventName.SwapStarted);
        assert.deepStrictEqual(reqs[12].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
        });

        assert.equal(reqs[13].event, MetaMetricsEventName.SwapCompleted);
        assert.equal(Object.keys(reqs[13].properties).length, 30);
        assert.equal(reqs[13].properties.token_from, 'TESTETH');
        assert.equal(reqs[13].properties.token_from_amount, '2');
        assert.equal(reqs[13].properties.token_to, 'DAI');
        assert.equal(typeof reqs[13].properties.token_to_amount, 'string');
        assert.equal(reqs[13].properties.slippage, 2);
        assert.equal(reqs[13].properties.custom_slippage, false);
        assert.equal(reqs[13].properties.best_quote_source, 'airswapV4');
        assert.equal(
          typeof reqs[13].properties.other_quote_selected,
          'boolean',
        );
        assert.equal(
          typeof reqs[13].properties.other_quote_selected_source,
          'string',
        );
        assert.equal(typeof reqs[13].properties.gas_fees, 'string');
        assert.equal(typeof reqs[13].properties.estimated_gas, 'string');
        assert.equal(reqs[13].properties.suggested_gas_price, '30');
        assert.equal(reqs[13].properties.used_gas_price, '30');
        assert.equal(reqs[13].properties.is_hardware_wallet, false);
        assert.equal(reqs[13].properties.stx_enabled, false);
        assert.equal(reqs[13].properties.current_stx_enabled, false);
        assert.equal(typeof reqs[13].properties.reg_tx_fee_in_usd, 'number');
        assert.equal(typeof reqs[13].properties.reg_tx_fee_in_eth, 'number');
        assert.equal(
          typeof reqs[13].properties.reg_tx_max_fee_in_usd,
          'number',
        );
        assert.equal(
          typeof reqs[13].properties.reg_tx_max_fee_in_eth,
          'number',
        );
        assert.equal(reqs[13].properties.token_to_amount_received, '');
        assert.equal(reqs[13].properties.quote_vs_executionRatio, null);
        assert.equal(reqs[13].properties.estimated_vs_used_gasRatio, '100%');
        assert.equal(reqs[13].properties.approval_gas_cost_in_eth, 0);
        assert.equal(
          typeof reqs[13].properties.trade_gas_cost_in_eth,
          'number',
        );
        assert.equal(
          typeof reqs[13].properties.trade_and_approval_gas_cost_in_eth,
          'number',
        );
        assert.equal(reqs[13].properties.category, 'Swaps');
        assert.equal(reqs[13].properties.locale, 'en');
        assert.equal(reqs[13].properties.chain_id, '0x539');
        assert.equal(reqs[13].properties.environment_type, 'background');

        assert.equal(reqs[14].event, MetaMetricsEventName.SwapCompleted);
        assert.deepStrictEqual(reqs[14].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'background',
          locale: 'en',
        });

        assert.equal(reqs[15].event, MetaMetricsEventName.ExitedSwaps);
        assert.equal(Object.keys(reqs[15].properties).length, 12);
        assert.equal(reqs[15].properties.token_from_amount, '2');
        assert.equal(reqs[15].properties.request_type, false);
        assert.equal(reqs[15].properties.slippage, 2);
        assert.equal(reqs[15].properties.custom_slippage, false);
        assert.equal(reqs[15].properties.current_screen, 'awaiting-swap');
        assert.equal(reqs[15].properties.is_hardware_wallet, false);
        assert.equal(reqs[15].properties.stx_enabled, false);
        assert.equal(reqs[15].properties.current_stx_enabled, false);
        assert.equal(reqs[15].properties.category, 'Swaps');
        assert.equal(reqs[15].properties.locale, 'en');
        assert.equal(reqs[15].properties.chain_id, '0x539');
        assert.equal(reqs[15].properties.environment_type, 'fullscreen');

        assert.equal(reqs[16].event, MetaMetricsEventName.ExitedSwaps);
        assert.deepStrictEqual(reqs[16].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
        });

        assert.equal(reqs[17].event, MetaMetricsEventName.ExitedSwaps);
        assert.equal(Object.keys(reqs[15].properties).length, 12);
        assert.equal(reqs[17].properties.custom_slippage, true);
        assert.equal(reqs[17].properties.current_screen, 'awaiting-swap');
        assert.equal(reqs[17].properties.is_hardware_wallet, false);
        assert.equal(reqs[17].properties.stx_enabled, false);
        assert.equal(reqs[17].properties.current_stx_enabled, false);
        assert.equal(reqs[17].properties.category, 'Swaps');
        assert.equal(reqs[17].properties.locale, 'en');
        assert.equal(reqs[17].properties.chain_id, '0x539');
        assert.equal(reqs[17].properties.environment_type, 'fullscreen');

        assert.equal(reqs[18].event, MetaMetricsEventName.ExitedSwaps);
        assert.deepStrictEqual(reqs[18].properties, {
          category: MetaMetricsEventCategory.Swaps,
          chain_id: toHex(1337),
          environment_type: 'fullscreen',
          locale: 'en',
        });
      },
    );
  });
});

async function getQuoteAndSwapTokens(driver) {
  await buildQuote(driver, {
    amount: 2,
    swapTo: 'DAI',
  });
  await reviewQuote(driver, {
    amount: 2,
    swapFrom: 'TESTETH',
    swapTo: 'DAI',
  });
  await changeExchangeRate(driver);
  await reviewQuote(driver, {
    amount: 2,
    swapFrom: 'TESTETH',
    swapTo: 'DAI',
    skipCounter: true,
  });
  await driver.clickElement({ text: 'Swap', tag: 'button' });
  await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
  await checkActivityTransaction(driver, {
    index: 0,
    amount: '2',
    swapFrom: 'TESTETH',
    swapTo: 'DAI',
  });
}
