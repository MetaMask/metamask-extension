import { toCaipAccountId } from '@metamask/utils';
import { chunk } from 'lodash';

/**
 * Options for batch processing with Promise.all
 */
export type BatchProcessOptions<TItem, TResult> = {
  /** Array of items to process in batches */
  items: TItem[];
  /** Maximum size of each batch */
  batchSize: number;
  /** Function to process each batch, should return a Promise */
  processBatch: (batch: TItem[]) => Promise<TResult | null>;
  /** Optional function to merge results from all successful batches */
  mergeResults?: (results: TResult[]) => TResult;
  /** Optional logging function for batch processing info */
  logger?: {
    warn: (message: string) => void;
    debug: (message: string) => void;
  };
};

/**
 * Processes an array of items in parallel batches using Promise.all.
 * Filters out failed batches and optionally merges successful results.
 *
 * @param options - Configuration options for batch processing
 * @returns Promise resolving to merged result or null if all batches failed
 * @example
 * ```typescript
 * const addresses = ['0x1', '0x2', '0x3', ...];
 *
 * const result = await processInBatches({
 *   items: addresses,
 *   batchSize: 50,
 *   processBatch: async (addressBatch) => {
 *     const response = await fetch(`/api/balances?addresses=${addressBatch.join(',')}`);
 *     return response.ok ? await response.json() : null;
 *   },
 *   mergeResults: (results) => ({
 *     balances: results.reduce((acc, result) => ({ ...acc, ...result.balances }), {})
 *   }),
 *   logger: console
 * });
 * ```
 */
export async function processInBatches<TItem, TResult>(
  options: BatchProcessOptions<TItem, TResult>,
): Promise<TResult | null> {
  const { items, batchSize, processBatch, mergeResults, logger } = options;

  if (items.length === 0) {
    return null;
  }

  // Split items into batches
  const batches = chunk(items, batchSize);

  logger?.debug(
    `Processing ${items.length} items in ${batches.length} batches of max ${batchSize} each`,
  );

  try {
    // Execute all batches in parallel using Promise.all
    const batchResults = await Promise.all(
      batches.map(async (batch, index) => {
        try {
          const result = await processBatch(batch);
          if (result === null) {
            logger?.warn(`Batch ${index + 1} failed and returned null`);
          }
          return result;
        } catch (error) {
          logger?.warn(
            `Batch ${index + 1} failed with error: ${String(error)}`,
          );
          return null;
        }
      }),
    );

    // Filter out failed batches
    const successfulResults: TResult[] = [];
    for (const result of batchResults) {
      if (result !== null) {
        successfulResults.push(result);
      }
    }

    if (successfulResults.length <= 0) {
      logger?.warn('All batches failed');
      return null;
    }

    logger?.debug(
      `Successfully processed ${successfulResults.length}/${batches.length} batches`,
    );

    // Merge results if a merge function is provided
    if (mergeResults) {
      return mergeResults(successfulResults);
    }

    // If no merge function provided, return the first successful result
    const firstResult = successfulResults[0] || null;
    return firstResult;
  } catch (error) {
    logger?.warn(`Batch processing failed: ${String(error)}`);
    return null;
  }
}

/**
 * Utility function specifically for processing Account API balance requests in batches.
 * This is a specialized wrapper around processInBatches for the common use case
 * of fetching account balances from the MetaMask Account API.
 */
export type AccountApiBalanceResponse = {
  balances: Record<
    string,
    {
      object: string;
      balance: string;
      accountAddress: string;
      type: 'native' | 'erc20';
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      chainId: number;
    }
  >;
};

export type AccountApiBatchOptions = {
  addresses: string[];
  supportedChainIds: string[];
  accountApiBaseUrl: string;
  batchSize?: number;
  logger?: {
    warn: (message: string) => void;
    debug: (message: string) => void;
  };
};

/**
 * Fetches account balances from MetaMask Account API in batches using Promise.all.
 * Automatically handles CAIP address formatting and result merging.
 *
 * @param options - Configuration for Account API batch requests
 * @returns Promise resolving to merged account balance data or null if failed
 */
export async function fetchAccountBalancesInBatches(
  options: AccountApiBatchOptions,
): Promise<AccountApiBalanceResponse | null> {
  const {
    addresses,
    supportedChainIds,
    accountApiBaseUrl,
    batchSize = 50,
    logger,
  } = options;

  const networksParam = supportedChainIds.join(',');

  return processInBatches<string, AccountApiBalanceResponse>({
    items: addresses,
    batchSize,
    processBatch: async (addressBatch) => {
      // Convert addresses to CAIP format: eip155:{chainId}:0x...
      // Note: supportedChainIds are in decimal format, so we use the first one for CAIP
      // since all addresses in a batch are for the same chain
      const chainId = supportedChainIds[0];

      const accountAddressesParam = addressBatch
        .map((address) => toCaipAccountId('eip155', chainId, address))
        .join(',');

      const url = `${accountApiBaseUrl}/v4/multiaccount/balances?networks=${networksParam}&accountAddresses=${accountAddressesParam}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        logger?.warn(
          `Account API batch request failed with status ${response.status}: ${response.statusText}`,
        );
        return null;
      }

      const jsonResponse = await response.json();
      return jsonResponse as AccountApiBalanceResponse;
    },
    mergeResults: (results) => {
      // Merge all batch results into a single response
      const mergedResponse: AccountApiBalanceResponse = { balances: {} };

      results.forEach((batchResult) => {
        // The API returns balances as a flat Record<string, TokenInfo> where keys are token identifiers
        // Simply merge all token entries from all batches
        Object.assign(mergedResponse.balances, batchResult.balances);
      });

      return mergedResponse;
    },
    logger,
  });
}
