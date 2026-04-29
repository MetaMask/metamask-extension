'use strict';

const CHECK_RESULT_ASSERT = { operator: 'eq', field: 'pass', value: true };
const CHECK_RESULT_FIXTURES = {
  pass: '{"pass":true}',
  fail: '{"pass":false}',
};

const REGISTRY = {
  'perps.tab_visible': {
    description: 'Perps tab is visible on the home screen',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (callHandler) => {
      const result = await callHandler('mm_wait_for', {
        testId: 'account-overview__perps-tab',
        timeoutMs: 5000,
      });
      if (!result.ok)
        return {
          pass: false,
          hint: 'Perps tab not visible. Ensure wallet is unlocked and on the home screen.',
        };
      const { found } = result.result;
      return {
        pass: found === true,
        hint: found
          ? 'Perps tab is visible'
          : 'Perps tab not found. Check that the feature is enabled.',
      };
    },
  },

  'perps.on_market': {
    description: 'User is on a perps market detail page',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (callHandler) => {
      const result = await callHandler('mm_get_state', {});
      if (!result.ok) return { pass: false, hint: 'Cannot get state.' };
      const url = result.result?.state?.currentUrl;
      const onMarket = url?.includes('/perps/market/') ?? false;
      return {
        pass: onMarket,
        hint: onMarket
          ? 'On perps market page'
          : `Expected to be on a perps market page, current URL: ${url ?? 'unknown'}`,
      };
    },
  },

  'perps.feature_enabled': {
    description:
      'Perps feature flag is enabled (PerpsController exists in state)',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (_callHandler, _params, context) => {
      if (!context) return { pass: false, hint: 'No eval context available.' };
      const page = context.getPage();
      const raw = await page.evaluate(
        '(function(){var m=stateHooks.store.getState().metamask;return JSON.stringify({has:m.activeProvider!==undefined})})()',
      );
      const parsed = JSON.parse(String(raw));
      return {
        pass: parsed.has === true,
        hint: parsed.has
          ? 'PerpsController present in state'
          : 'PerpsController not found. Enable PERPS_ENABLED flag and rebuild.',
      };
    },
  },

  'perps.ready_to_trade': {
    description: 'Perps provider is initialized and ready to trade',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (_callHandler, _params, context) => {
      if (!context) return { pass: false, hint: 'No eval context available.' };
      const page = context.getPage();
      const raw = await page.evaluate(
        '(function(){var m=stateHooks.store.getState().metamask;return JSON.stringify({hasProvider:!!m.activeProvider,provider:m.activeProvider})})()',
      );
      const parsed = JSON.parse(String(raw));
      return {
        pass: parsed.hasProvider,
        hint: parsed.hasProvider
          ? `Perps ready (provider=${parsed.provider})`
          : 'Perps not ready: activeProvider not set. Ensure PerpsController is initialized.',
      };
    },
  },

  'perps.sufficient_balance': {
    description: 'Perps account has sufficient balance to trade',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (_callHandler, _params, context) => {
      if (!context) return { pass: false, hint: 'No eval context available.' };
      const page = context.getPage();
      const raw = await page.evaluate(
        "(async()=>{var r=await stateHooks.submitRequestToBackground('perpsGetAccountState',[]);return JSON.stringify(r??{})})()",
      );
      const parsed = JSON.parse(String(raw));
      const balance = parseFloat(parsed.totalBalance ?? '0');
      return {
        pass: balance > 0,
        hint:
          balance > 0
            ? `Perps balance: $${balance}`
            : 'Perps balance is zero. Deposit funds (mainnet) or use a funded testnet account.',
      };
    },
  },

  'perps.open_position': {
    description: 'At least one open perps position exists',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (_callHandler, params, context) => {
      if (!context) return { pass: false, hint: 'No eval context available.' };
      const page = context.getPage();
      const symbol = params?.symbol ? String(params.symbol) : '';
      const raw = await page.evaluate(
        `(async()=>{var pos=await stateHooks.submitRequestToBackground('perpsGetPositions',[]);pos=pos??[];var filtered=${symbol ? `pos.filter(function(p){return p.symbol===${JSON.stringify(symbol)}})` : 'pos'};return JSON.stringify({count:filtered.length})})()`,
      );
      const parsed = JSON.parse(String(raw));
      const has = parsed.count > 0;
      return {
        pass: has,
        hint: has
          ? `${parsed.count} open position(s)${symbol ? ` for ${symbol}` : ''}`
          : `No open positions${symbol ? ` for ${symbol}` : ''}. Open a position first.`,
      };
    },
  },

  'perps.no_open_position': {
    description: 'No open position on the current market detail page',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (_callHandler, _params, context) => {
      if (!context) return { pass: false, hint: 'No eval context available.' };
      const page = context.getPage();
      const count = await page
        .locator('[data-testid="perps-close-cta-button"]')
        .count();
      const clear = count === 0;
      return {
        pass: clear,
        hint: clear
          ? 'No open position on this market'
          : 'There is an open position. Close it first (use close-position flow).',
      };
    },
  },

  'perps.open_limit_order': {
    description: 'At least one open perps limit order exists',
    assert: CHECK_RESULT_ASSERT,
    fixtures: CHECK_RESULT_FIXTURES,
    check: async (_callHandler, params, context) => {
      if (!context) return { pass: false, hint: 'No eval context available.' };
      const page = context.getPage();
      const symbol = params?.symbol ? String(params.symbol) : '';
      const raw = await page.evaluate(
        `(async()=>{var orders=await stateHooks.submitRequestToBackground('perpsGetOpenOrders',[]);orders=orders??[];var filtered=${symbol ? `orders.filter(function(o){return o.symbol===${JSON.stringify(symbol)}})` : 'orders'};return JSON.stringify({count:filtered.length})})()`,
      );
      const parsed = JSON.parse(String(raw));
      const has = parsed.count > 0;
      return {
        pass: has,
        hint: has
          ? `${parsed.count} open order(s)${symbol ? ` for ${symbol}` : ''}`
          : `No open limit orders${symbol ? ` for ${symbol}` : ''}. Place a limit order first.`,
      };
    },
  },
};

module.exports = { REGISTRY };
