import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { AssetData, ResolvedTicker } from './types';

type SendRuntimeMessage = (
  message: Record<string, unknown>,
) => Promise<unknown>;

export function createTickerResolver(sendRuntimeMessage: SendRuntimeMessage) {
  const cache = new Map<string, ResolvedTicker>();
  const pending = new Map<string, Promise<ResolvedTicker | null>>();

  return (symbol: string) => {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker) {
      return Promise.resolve(null);
    }

    const cached = cache.get(ticker);
    if (cached) {
      return Promise.resolve(cached);
    }

    const inFlight = pending.get(ticker);
    if (inFlight !== undefined) {
      return inFlight;
    }

    const request = sendRuntimeMessage({
      type: EXTENSION_MESSAGES.GET_DATA,
      body: { symbol: ticker },
    })
      .then((response) => {
        const typedResponse = response as
          | { body?: { asset?: AssetData; similar?: unknown } }
          | undefined;
        const primary = typedResponse?.body?.asset;
        const similar = typedResponse?.body?.similar;
        if (!primary || typeof primary !== 'object') {
          return null;
        }
        const resolved: ResolvedTicker = {
          primary,
          similar: Array.isArray(similar) ? similar : [],
        };
        cache.set(ticker, resolved);
        return resolved;
      })
      .catch(() => null)
      .finally(() => {
        pending.delete(ticker);
      });

    pending.set(ticker, request);
    return request;
  };
}
