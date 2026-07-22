import browser from 'webextension-polyfill';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { swapRoute } from './lib/constants';
import type { Controller } from './lib/types';

type RateSource =
  | { kind: 'multichainRates'; rateKey: string }
  | {
      kind: 'currencyRates';
      rateKey: string;
      percentChange?: { chainId: string; tokenAddress: string };
    };

type WhitelistEntry = {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  rate: RateSource;
};

// Stub until a real backend / remote-config allowlist exists.
/* eslint-disable @metamask/design-tokens/color-no-hex -- asset brand colors, not UI tokens */
const cashtagWhitelist: WhitelistEntry[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: '#f7931a',
    rate: { kind: 'multichainRates', rateKey: 'btc' },
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: '#627eea',
    rate: {
      kind: 'currencyRates',
      rateKey: 'ETH',
      percentChange: {
        chainId: '0x1',
        tokenAddress: '0x0000000000000000000000000000000000000000',
      },
    },
  },
];
/* eslint-enable @metamask/design-tokens/color-no-hex */

let registered = false;

function getUsdPrice(
  rate:
    | { conversionRate?: number | null; usdConversionRate?: number | null }
    | undefined,
  fiatCurrency?: string,
) {
  if (typeof rate?.usdConversionRate === 'number') {
    return rate.usdConversionRate;
  }
  if (
    fiatCurrency?.toLowerCase() === 'usd' &&
    typeof rate?.conversionRate === 'number'
  ) {
    return rate.conversionRate;
  }
  return null;
}

function lookupPrice(controller: Controller | undefined, symbol: string) {
  const entry = cashtagWhitelist.find((asset) => asset.symbol === symbol);
  if (!entry) {
    return { symbol, value: null, percentChange: null };
  }

  const { rate } = entry;
  if (rate.kind === 'multichainRates') {
    const ratesState = controller?.multichainRatesController?.state;
    return {
      symbol,
      value: getUsdPrice(
        ratesState?.rates?.[rate.rateKey],
        ratesState?.fiatCurrency,
      ),
      percentChange: null,
    };
  }

  const currencyState = controller?.currencyRateController?.state;
  let percentChange: number | null = null;
  if (rate.percentChange) {
    const raw =
      controller?.tokenRatesController?.state?.marketData?.[
        rate.percentChange.chainId
      ]?.[rate.percentChange.tokenAddress]?.pricePercentChange1d ?? null;
    percentChange = typeof raw === 'number' ? raw : null;
  }
  return {
    symbol,
    value: getUsdPrice(
      currencyState?.currencyRates?.[rate.rateKey],
      currencyState?.currentCurrency,
    ),
    percentChange,
  };
}

function getMessageString(
  message: { body?: Record<string, unknown>; [key: string]: unknown },
  key: string,
): string | null {
  const fromBody = message.body?.[key];
  if (typeof fromBody === 'string') {
    return fromBody;
  }
  const fromRoot = message[key];
  if (typeof fromRoot === 'string') {
    return fromRoot;
  }
  return null;
}

export function registerBackgroundBridge({
  getController,
}: {
  getController: () => Controller | undefined;
}) {
  if (registered) {
    return;
  }
  registered = true;

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG) {
      const flagName = getMessageString(message, 'flagName');
      if (!flagName) {
        return undefined;
      }
      const controller = getController();
      const flags = {
        ...(controller?.remoteFeatureFlagController?.state
          ?.remoteFeatureFlags ?? {}),
        ...(getManifestFlags().remoteFeatureFlags ?? {}),
      };
      return Promise.resolve({
        type: EXTENSION_MESSAGES.GET_REMOTE_FEATURE_FLAG,
        body: {
          flagName,
          enabled: getBooleanFeatureFlag(flags[flagName], false),
        },
      });
    }

    if (message?.type === EXTENSION_MESSAGES.GET_ASSET_WHITELIST) {
      return Promise.resolve({
        type: EXTENSION_MESSAGES.GET_ASSET_WHITELIST,
        body: {
          assets: cashtagWhitelist.map(({ symbol, name, icon, color }) => ({
            symbol,
            name,
            icon,
            color,
          })),
        },
      });
    }

    if (message?.type === EXTENSION_MESSAGES.GET_ASSET_PRICE) {
      const symbolRaw = getMessageString(message, 'symbol') ?? '';
      const raw = symbolRaw.toUpperCase();
      const allowed = cashtagWhitelist.some((asset) => asset.symbol === raw);
      const snapshot = allowed
        ? lookupPrice(getController(), raw)
        : { symbol: raw || null, value: null, percentChange: null };
      return Promise.resolve({
        type: EXTENSION_MESSAGES.GET_ASSET_PRICE,
        body: snapshot,
      });
    }

    if (message?.type === EXTENSION_MESSAGES.OPEN_SWAP_PAGE) {
      const controller = getController();
      const windowId = sender?.tab?.windowId;
      const tabId = sender?.tab?.id;
      const sidePanelApi = globalThis.chrome?.sidePanel ?? browser.sidePanel;
      const hasWindowId = typeof windowId === 'number';
      const hasTabId = typeof tabId === 'number';

      if (!sidePanelApi?.open || (!hasWindowId && !hasTabId)) {
        return Promise.resolve({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: { ok: false, reason: 'sidepanel-unavailable' },
        });
      }

      // Home consumes this and navigates to Swap (sidepanel only).
      controller?.appStateController?.setPendingRedirectRoute?.({
        path: swapRoute,
        environmentType: ENVIRONMENT_TYPE_SIDEPANEL,
      });

      // Must call open synchronously in this turn to keep the user gesture.
      const openResult = hasWindowId
        ? sidePanelApi.open({ windowId })
        : sidePanelApi.open({ tabId });

      return Promise.resolve(openResult).then(
        () => ({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: { ok: true },
        }),
        (error: unknown) => ({
          type: EXTENSION_MESSAGES.OPEN_SWAP_PAGE,
          body: {
            ok: false,
            reason: 'sidepanel-open-failed',
            error: error instanceof Error ? error.message : String(error),
          },
        }),
      );
    }

    return undefined;
  });
}
