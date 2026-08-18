import { bridgeQuotesKeys, bridgeQuotesOptions } from './quotes';

export const bridgeQueries = {
  quotes: {
    keys: bridgeQuotesKeys,
    options: bridgeQuotesOptions,
  },
};

export {
  bridgeQuotesDefaultMaxRefreshCount,
  bridgeQuotesDefaultRefreshIntervalMs,
  bridgeQuotesKeys,
  bridgeQuotesOptions,
  type BridgeQuotesQueryOptions,
  type BridgeQuotesQueryParams,
} from './quotes';
