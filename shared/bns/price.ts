/**
 * BRNKC/USD price query from BNESOracle.
 *
 * Fail-closed: requires a configured oracle address.
 * Cached: price is cached for BNS_ORACLE_PRICE_CACHE_TTL_MS (default 5 minutes)
 * to avoid unnecessary RPC calls between keeper updates.
 *
 * Polling frequency rationale:
 *   - Keeper submits every 300s (KEEPER_INTERVAL)
 *   - Oracle maxAge is 3600s
 *   - MetaMask assets controller polls every 180_000ms
 *   - 5-minute cache matches keeper interval — no value in faster polling.
 */

import { Interface } from '@ethersproject/abi';

import { ethCallWithQuorum } from './quorum';
import type { BnsRuntimeConfig, BnsEthCall } from './resolve';
import {
  BRNKC_NATIVE_ADDRESS,
  BRNKC_USD_VIRTUAL_ADDRESS,
  BNS_ORACLE_PRICE_CACHE_TTL_MS,
} from './constants';

const ORACLE_GET_PRICE_FRAGMENT =
  'function getPrice(address, address) view returns (uint256 price, uint256 timestamp)';

const oracleInterface = new Interface([ORACLE_GET_PRICE_FRAGMENT]);

export type BrnkcPriceResult = {
  /** Price in wei (18 decimals), USD per 1 BRNKC. */
  priceWei: bigint;
  /** Unix timestamp seconds from the oracle. */
  timestamp: number;
  /** How long this result has been cached (ms). */
  cacheAgeMs: number;
};

type CachedPrice = {
  priceWei: bigint;
  timestamp: number;
  fetchedAt: number;
};

let cache: CachedPrice | null = null;

/**
 * Clear the price cache (useful for tests).
 */
export function clearBrnkcPriceCache(): void {
  cache = null;
}

/**
 * Query BRNKC/USD from BNESOracle with fail-closed config check and cache.
 *
 * @param config - BNS runtime config (requires oracleAddress).
 * @param ethCall - Injected eth_call (defaults to quorum).
 * @returns Price and timestamp.
 */
export async function getBrnkcUsdPrice(
  config: BnsRuntimeConfig,
  ethCall?: BnsEthCall,
): Promise<BrnkcPriceResult> {
  if (!config.oracleAddress) {
    throw new Error('BNS oracle address is not configured (fail closed)');
  }
  if (
    config.oracleAddress ===
      '0x0000000000000000000000000000000000000000'.toLowerCase()
  ) {
    throw new Error('BNS oracle address is not configured (fail closed)');
  }

  const now = Date.now();
  if (cache && now - cache.fetchedAt < BNS_ORACLE_PRICE_CACHE_TTL_MS) {
    return {
      priceWei: cache.priceWei,
      timestamp: cache.timestamp,
      cacheAgeMs: now - cache.fetchedAt,
    };
  }

  const call = ethCall ?? defaultEthCall(config);
  const data = oracleInterface.encodeFunctionData('getPrice', [
    BRNKC_NATIVE_ADDRESS,
    BRNKC_USD_VIRTUAL_ADDRESS,
  ]);

  const raw = await call({
    to: config.oracleAddress,
    data,
  });

  let priceWei: bigint;
  let timestamp: number;
  try {
    const [price, ts] = oracleInterface.decodeFunctionResult(
      'getPrice',
      raw,
    ) as [bigint, bigint];
    priceWei = price;
    timestamp = Number(ts);
  } catch {
    throw new Error('Failed to decode BNESOracle getPrice result');
  }

  const priceValue = typeof priceWei === 'bigint' ? priceWei : BigInt(priceWei);
  if (priceValue === 0n) {
    throw new Error('BNESOracle returned zero price (no keeper reports yet)');
  }

  cache = {
    priceWei: priceValue,
    timestamp,
    fetchedAt: now,
  };

  return {
    priceWei: priceValue,
    timestamp,
    cacheAgeMs: 0,
  };
}

function defaultEthCall(config: BnsRuntimeConfig): BnsEthCall {
  return async ({ to, data }) =>
    ethCallWithQuorum(
      { to, data },
      {
        rpcUrls: config.rpcUrls,
        timeoutMs: config.timeoutMs,
      },
    );
}
