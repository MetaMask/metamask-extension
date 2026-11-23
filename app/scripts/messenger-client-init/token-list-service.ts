import { TokenListService } from '@metamask/assets-controllers';

/**
 * Shared singleton instance of TokenListService.
 *
 * TokensController requires a tokenListService to fetch token metadata
 * on-demand. A single shared instance ensures a consistent TanStack Query
 * cache (4-hour stale time), avoiding duplicate network requests.
 */
export const tokenListService = new TokenListService();
