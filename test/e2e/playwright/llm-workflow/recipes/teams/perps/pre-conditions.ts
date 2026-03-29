/**
 * Perps-specific pre-condition registry.
 */

import type {
  PreConditionRegistry,
  PreConditionContext,
  CallHandlerFn,
} from '../../lib/pre-condition-runner';
import { getServiceWorkerPage, evalAsync } from '../../lib/eval-engine';

export const REGISTRY: PreConditionRegistry = {
  'perps.tab_visible': {
    description: 'Perps tab is visible on the home screen',
    check: async (callHandler: CallHandlerFn) => {
      const result = await callHandler('mm_wait_for', {
        testId: 'account-overview__perps-tab',
        timeoutMs: 5000,
      });
      if (!result.ok) {
        return {
          pass: false,
          hint: 'Perps tab not visible. Ensure wallet is unlocked and on the home screen.',
        };
      }
      const { found } = result.result as Record<string, unknown>;
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
    check: async (callHandler: CallHandlerFn) => {
      const result = await callHandler('mm_get_state', {});
      if (!result.ok) {
        return { pass: false, hint: 'Cannot get state.' };
      }
      const state = (result.result as Record<string, unknown>).state as
        | Record<string, unknown>
        | undefined;
      const url = state?.currentUrl as string | undefined;
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
    description: 'Perps feature flag is enabled (PerpsController exists in state)',
    check: async (
      _callHandler: CallHandlerFn,
      _params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      if (!context) {
        return { pass: false, hint: 'No eval context available.' };
      }
      const swPage = await getServiceWorkerPage(
        context.getContext(),
        context.extensionId,
      );
      const raw = await evalAsync(
        swPage,
        "(async()=>{const s=await chrome.storage.local.get('data');" +
          'return JSON.stringify({has:!!s?.data?.PerpsController})})()',
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
    description: 'Perps system is initialized and ready to trade',
    check: async (
      _callHandler: CallHandlerFn,
      _params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      if (!context) {
        return { pass: false, hint: 'No eval context available.' };
      }
      const swPage = await getServiceWorkerPage(
        context.getContext(),
        context.extensionId,
      );
      const raw = await evalAsync(
        swPage,
        "(async()=>{const s=await chrome.storage.local.get('data');" +
          'const pc=s?.data?.PerpsController??{};' +
          'const hasAccount=!!pc.accountState;' +
          "const hasProvider=!!pc.activeProvider;" +
          'return JSON.stringify({hasAccount,hasProvider})})()',
      );
      const parsed = JSON.parse(String(raw));
      const ready = parsed.hasAccount && parsed.hasProvider;
      return {
        pass: ready,
        hint: ready
          ? 'Perps ready (account + provider active)'
          : `Perps not ready: accountState=${parsed.hasAccount}, activeProvider=${parsed.hasProvider}. Navigate to perps tab to initialize.`,
      };
    },
  },

  'perps.sufficient_balance': {
    description: 'Perps account has positive balance',
    check: async (
      _callHandler: CallHandlerFn,
      _params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      if (!context) {
        return { pass: false, hint: 'No eval context available.' };
      }
      const swPage = await getServiceWorkerPage(
        context.getContext(),
        context.extensionId,
      );
      const raw = await evalAsync(
        swPage,
        "(async()=>{const s=await chrome.storage.local.get('data');" +
          'const pc=s?.data?.PerpsController??{};' +
          "const bal=parseFloat(pc.accountState?.totalBalance||'0');" +
          'return JSON.stringify({bal})})()',
      );
      const parsed = JSON.parse(String(raw));
      const has = parsed.bal > 0;
      return {
        pass: has,
        hint: has
          ? `Perps balance: $${parsed.bal}`
          : 'Deposit funds to perps account first.',
      };
    },
  },

  'perps.open_position': {
    description: 'At least one open perps position exists',
    check: async (
      _callHandler: CallHandlerFn,
      params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      if (!context) {
        return { pass: false, hint: 'No eval context available.' };
      }
      const swPage = await getServiceWorkerPage(
        context.getContext(),
        context.extensionId,
      );
      const symbol = params?.symbol ? String(params.symbol) : '';
      const raw = await evalAsync(
        swPage,
        "(async()=>{const s=await chrome.storage.local.get('data');" +
          'const pos=s?.data?.PerpsController?.cachedPositions??[];' +
          `const filtered=${symbol ? `pos.filter(p=>p.symbol===${JSON.stringify(symbol)})` : 'pos'};` +
          'return JSON.stringify({count:filtered.length})})()',
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
    check: async (
      _callHandler: CallHandlerFn,
      _params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      if (!context) {
        return { pass: false, hint: 'No eval context available.' };
      }
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
    check: async (
      _callHandler: CallHandlerFn,
      params?: Record<string, unknown>,
      context?: PreConditionContext,
    ) => {
      if (!context) {
        return { pass: false, hint: 'No eval context available.' };
      }
      const swPage = await getServiceWorkerPage(
        context.getContext(),
        context.extensionId,
      );
      const symbol = params?.symbol ? String(params.symbol) : '';
      const raw = await evalAsync(
        swPage,
        "(async()=>{const s=await chrome.storage.local.get('data');" +
          'const orders=s?.data?.PerpsController?.cachedOrders??[];' +
          `const filtered=${symbol ? `orders.filter(o=>o.symbol===${JSON.stringify(symbol)})` : 'orders'};` +
          'return JSON.stringify({count:filtered.length})})()',
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
