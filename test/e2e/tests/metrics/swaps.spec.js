const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  generateGanacheOptions,
  unlockWallet,
  getEventPayloads,
  assertInAnyOrder,
  genRandInitBal,
} = require('../../helpers');
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
} = require('../../../../shared/constants/metametrics');
const { GAS_API_BASE_URL } = require('../../../../shared/constants/swaps');
const {
  TOKENS_API_MOCK_RESULT,
  TOP_ASSETS_API_MOCK_RESULT,
  AGGREGATOR_METADATA_API_MOCK_RESULT,
  GAS_PRICE_API_MOCK_RESULT,
  FEATURE_FLAGS_API_MOCK_RESULT,
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
      .forGet(`${GAS_API_BASE_URL}/networks/1/gasPrices`)
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

describe('Swap Eth for another Token @no-mmi', function () {
  it('Completes a Swap between ETH and DAI after changing initial rate', async function () {
    const { initialBalanceInHex } = genRandInitBal();

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: generateGanacheOptions({
          balance: initialBalanceInHex,
        }),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegmentAndMetaswapRequests,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        await getQuoteAndSwapTokens(driver);

        const metricsReqs = await assertReqsNumAndFilterMetrics(
          driver,
          mockedEndpoints,
        );

        await assertNavSwapButtonClickedEvent(metricsReqs);

        await assertPrepareSwapPageLoadedEvents(metricsReqs);

        await assertQuotesRequestedEvents(metricsReqs);

        await assertQuotesReceivedAndBestQuoteReviewedEvents(metricsReqs);

        await assertAllAvailableQuotesOpenedEvents(metricsReqs);

        await assertSwapStartedEvents(metricsReqs);

        await assertSwapCompletedEvents(metricsReqs);

        await assertExitedSwapsEvents(metricsReqs);
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

async function assertReqsNumAndFilterMetrics(driver, mockedEndpoints) {
  const events = await getEventPayloads(driver, mockedEndpoints);

  const numberOfMetaswapRequests = 8;
  assert.equal(
    events.length,
    numberOfSegmentRequests + numberOfMetaswapRequests,
  );

  const reqs = events.slice(0, numberOfSegmentRequests);

  return reqs;
}

async function assertNavSwapButtonClickedEvent(reqs) {
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
}

async function assertPrepareSwapPageLoadedEvents(reqs) {
  const assertionsReq1 = [
    (req) => req.event === MetaMetricsEventName.PrepareSwapPageLoaded,
    (req) => Object.keys(req.properties).length === 7,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.current_stx_enabled === false,
    (req) => req.properties?.is_hardware_wallet === false,
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
    assertInAnyOrder([reqs[1], reqs[2]], [assertionsReq1, assertionsReq2]),
    'assertPrepareSwapPageLoadedEvents(): reqs[1] and reqs[2] did not match what was expected',
  );
}

async function assertQuotesRequestedEvents(reqs) {
  const assertionsReq3 = [
    (req) => req.event === MetaMetricsEventName.QuotesRequested,
    (req) => Object.keys(req.properties).length === 14,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.anonymizedData === true,
    (req) => req.properties?.current_stx_enabled === false,
    (req) => req.properties?.custom_slippage === false,
    (req) => req.properties?.is_hardware_wallet === false,
    (req) => req.properties?.request_type === 'Order',
    (req) => req.properties?.slippage === 2,
    (req) => req.properties?.stx_enabled === false,
    (req) => req.properties?.token_from === 'TESTETH',
    (req) => req.properties?.token_from_amount === '2',
    (req) => req.properties?.token_to === 'DAI',
  ];

  const assertionsReq4 = [
    (req) => req.event === MetaMetricsEventName.QuotesRequested,
    (req) => Object.keys(req.properties).length === 4,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',
  ];

  assert.ok(
    assertInAnyOrder([reqs[3], reqs[4]], [assertionsReq3, assertionsReq4]),
    'assertQuotesRequestedEvents(): reqs[3] and reqs[4] did not match what was expected',
  );
}

async function assertQuotesReceivedAndBestQuoteReviewedEvents(reqs) {
  const assertionsReq5 = [
    (req) => req.event === MetaMetricsEventName.QuotesReceived,
    (req) => Object.keys(req.properties).length === 18,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.anonymizedData === true,
    (req) => typeof req.properties?.available_quotes === 'number',
    (req) => typeof req.properties?.best_quote_source === 'string',
    (req) => req.properties?.current_stx_enabled === false,
    (req) => req.properties?.custom_slippage === false,
    (req) => req.properties?.is_hardware_wallet === false,
    (req) => req.properties?.request_type === 'Order',
    (req) => typeof req.properties?.response_time === 'number',
    (req) => req.properties?.slippage === 2,
    (req) => req.properties?.stx_enabled === false,
    (req) => req.properties?.token_from === 'TESTETH',
    (req) => req.properties?.token_from_amount === '2',
    (req) => req.properties?.token_to === 'DAI',
    (req) => typeof req.properties?.token_to_amount === 'string',
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

  // When running this test on Chrome in particular,  reqs[5], reqs[6], reqs[7]
  // and reqs[8] sometimes switch order so we bundled them together for the
  // assertion

  assert.ok(
    assertInAnyOrder(
      [reqs[5], reqs[6], reqs[7], reqs[8]],
      [assertionsReq5, assertionsReq6, assertionsReq7, assertionsReq8],
    ),
    'assertQuotesReceivedAndBestQuoteReviewedEvents(): reqs[5], reqs[6], reqs[7] and reqs[8] did not match what was expected',
  );
}

async function assertAllAvailableQuotesOpenedEvents(reqs) {
  const assertionsReq9 = [
    (req) => req.event === MetaMetricsEventName.AllAvailableQuotesOpened,
    (req) => Object.keys(req.properties).length === 18,

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
    (req) => req.properties?.token_to === 'DAI',
    (req) => req.properties?.other_quote_selected === false,
    (req) => req.properties?.other_quote_selected_source === null,
    (req) => typeof req.properties?.token_to_amount === 'string',
  ];

  const assertionsReq10 = [
    (req) => req.event === MetaMetricsEventName.AllAvailableQuotesOpened,
    (req) => Object.keys(req.properties).length === 4,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',
  ];

  assert.ok(
    assertInAnyOrder([reqs[9], reqs[10]], [assertionsReq9, assertionsReq10]),
    'assertAllAvailableQuotesOpenedEvents(): reqs[9] and reqs[10] did not match what was expected',
  );
}

async function assertSwapStartedEvents(reqs) {
  const assertionsReq11 = [
    (req) => req.event === MetaMetricsEventName.SwapStarted,
    (req) => Object.keys(req.properties).length === 24,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.token_from === 'TESTETH',
    (req) => req.properties?.token_from_amount === '2',
    (req) => req.properties?.token_to === 'DAI',
    (req) => req.properties?.slippage === 2,
    (req) => req.properties?.custom_slippage === false,
    (req) => req.properties?.is_hardware_wallet === false,
    (req) => req.properties?.stx_enabled === false,
    (req) => req.properties?.current_stx_enabled === false,
    (req) => typeof req.properties?.token_to_amount === 'string',
    (req) => typeof req.properties?.best_quote_source === 'string',
    (req) => typeof req.properties?.other_quote_selected === 'boolean',
    (req) => typeof req.properties?.gas_fees === 'string',
    (req) => typeof req.properties?.estimated_gas === 'string',
    (req) => typeof req.properties?.suggested_gas_price === 'string',
    (req) => typeof req.properties?.reg_tx_fee_in_usd === 'number',
    (req) => typeof req.properties?.reg_tx_fee_in_eth === 'number',
    (req) => typeof req.properties?.reg_tx_max_fee_in_usd === 'number',
    (req) => typeof req.properties?.reg_tx_max_fee_in_eth === 'number',
    (req) => typeof req.properties?.other_quote_selected_source === 'string',
  ];

  const assertionsReq12 = [
    (req) => req.event === MetaMetricsEventName.SwapStarted,
    (req) => Object.keys(req.properties).length === 4,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',
  ];

  assert.ok(
    assertInAnyOrder([reqs[11], reqs[12]], [assertionsReq11, assertionsReq12]),
    'assertSwapStartedEvents(): reqs[11] and reqs[12] did not match what was expected',
  );
}

async function assertSwapCompletedEvents(reqs) {
  const assertionsReq13 = [
    (req) => req.event === MetaMetricsEventName.SwapCompleted,
    (req) => Object.keys(req.properties).length === 30,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'background',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.token_from === 'TESTETH',
    (req) => req.properties?.token_from_amount === '2',
    (req) => req.properties?.token_to === 'DAI',
    (req) => typeof req.properties?.token_to_amount === 'string',
    (req) => req.properties?.slippage === 2,
    (req) => req.properties?.custom_slippage === false,
    (req) => req.properties?.best_quote_source === 'airswapV4',
    (req) => typeof req.properties?.other_quote_selected === 'boolean',
    (req) => typeof req.properties?.other_quote_selected_source === 'string',
    (req) => typeof req.properties?.gas_fees === 'string',
    (req) => typeof req.properties?.estimated_gas === 'string',
    (req) => req.properties?.suggested_gas_price === '30',
    (req) => req.properties?.used_gas_price === '30',
    (req) => req.properties?.is_hardware_wallet === false,
    (req) => req.properties?.stx_enabled === false,
    (req) => req.properties?.current_stx_enabled === false,
    (req) => typeof req.properties?.reg_tx_fee_in_usd === 'number',
    (req) => typeof req.properties?.reg_tx_fee_in_eth === 'number',
    (req) => typeof req.properties?.reg_tx_max_fee_in_usd === 'number',
    (req) => typeof req.properties?.reg_tx_max_fee_in_eth === 'number',
    (req) => req.properties?.token_to_amount_received === '',
    (req) => req.properties?.quote_vs_executionRatio === null,
    (req) => req.properties?.estimated_vs_used_gasRatio === '100%',
    (req) => req.properties?.approval_gas_cost_in_eth === 0,
    (req) => typeof req.properties?.trade_gas_cost_in_eth === 'number',
    (req) =>
      typeof req.properties?.trade_and_approval_gas_cost_in_eth === 'number',
  ];

  const assertionsReq14 = [
    (req) => req.event === MetaMetricsEventName.SwapCompleted,
    (req) => Object.keys(req.properties).length === 4,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'background',
    (req) => req.properties?.locale === 'en',
  ];

  assert.ok(
    assertInAnyOrder([reqs[13], reqs[14]], [assertionsReq13, assertionsReq14]),
    'assertSwapCompletedEvents(): reqs[13] and reqs[14] did not match what was expected',
  );
}

async function assertExitedSwapsEvents(reqs) {
  const assertionsReq15 = [
    (req) => req.event === MetaMetricsEventName.ExitedSwaps,
    (req) => Object.keys(req.properties).length === 12,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.token_from_amount === '2',
    (req) => req.properties?.request_type === false,
    (req) => req.properties?.slippage === 2,
    (req) => req.properties?.custom_slippage === false,
    (req) => req.properties?.current_screen === 'awaiting-swap',
    (req) => req.properties?.is_hardware_wallet === false,
    (req) => req.properties?.stx_enabled === false,
    (req) => req.properties?.current_stx_enabled === false,
  ];

  const assertionsReq16 = [
    (req) => req.event === MetaMetricsEventName.ExitedSwaps,
    (req) => Object.keys(req.properties).length === 4,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',
  ];

  assert.ok(
    assertInAnyOrder([reqs[15], reqs[16]], [assertionsReq15, assertionsReq16]),
    'assertExitedSwapsEvents(): reqs[15] and reqs[16] did not match what was expected',
  );

  const assertionsReq17 = [
    (req) => req.event === MetaMetricsEventName.ExitedSwaps,
    (req) => Object.keys(req.properties).length === 9,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',

    (req) => req.properties?.custom_slippage === true,
    (req) => req.properties?.current_screen === 'awaiting-swap',
    (req) => req.properties?.is_hardware_wallet === false,
    (req) => req.properties?.stx_enabled === false,
    (req) => req.properties?.current_stx_enabled === false,
  ];

  const assertionsReq18 = [
    (req) => req.event === MetaMetricsEventName.ExitedSwaps,
    (req) => Object.keys(req.properties).length === 4,

    (req) => req.properties?.category === MetaMetricsEventCategory.Swaps,
    (req) => req.properties?.chain_id === toHex(1337),
    (req) => req.properties?.environment_type === 'fullscreen',
    (req) => req.properties?.locale === 'en',
  ];

  assert.ok(
    assertInAnyOrder([reqs[17], reqs[18]], [assertionsReq17, assertionsReq18]),
    'assertExitedSwapsEvents(): reqs[17] and reqs[18] did not match what was expected',
  );
}
