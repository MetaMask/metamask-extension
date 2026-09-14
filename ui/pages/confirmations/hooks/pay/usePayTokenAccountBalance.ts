'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  isCaipChainId,
  isStrictHexString,
  parseCaipChainId,
  type Hex,
} from '@metamask/utils';
import { useSendTokens } from '../send/useSendTokens';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';
import type { Asset } from '../../types/send';
import { useTransactionPayToken } from './useTransactionPayToken';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Hex;
/** Inert chain ID passed to `useTokenFiatRate` when no pay token is selected. */
const ABSENT_CHAIN_ID = '0x0' as Hex;

/**
 * Converts a 0x-prefixed hex quantity to a decimal string.
 *
 * @param hex - Hex-encoded integer, with or without a `0x` prefix.
 * @returns Decimal string representation.
 */
function hexToDecimalString(hex: string): string {
  return new BigNumber(hex.replace(/^0x/u, '') || '0', 16).toString(10);
}

/**
 * Normalizes a chain ID to a lowercase 0x-prefixed hex string.
 *
 * Accepts hex (`0x1`), decimal (`1`), or CAIP-2 (`eip155:1`) forms. Unsupported
 * or non-eip155 CAIP strings are lowercased and returned as-is so callers can
 * still attempt a string match.
 *
 * @param chainId - Chain ID in hex, decimal, or CAIP-2 form.
 * @returns Normalized hex chain ID, or `undefined` when input is absent.
 */
function toHexChainId(
  chainId: string | number | undefined,
): string | undefined {
  if (chainId === undefined || chainId === null) {
    return undefined;
  }

  const asString = String(chainId);
  if (isStrictHexString(asString)) {
    return asString.toLowerCase();
  }

  if (isCaipChainId(asString)) {
    const { namespace, reference } = parseCaipChainId(asString);
    if (namespace === 'eip155') {
      return `0x${Number(reference).toString(16)}`;
    }
  }

  if (/^\d+$/u.test(asString)) {
    return `0x${Number(asString).toString(16)}`;
  }

  return asString.toLowerCase();
}

/**
 * Address used when matching an asset against the selected pay token.
 *
 * Native assets resolve via `getNativeTokenAddress` for the given chain; if
 * that lookup fails, falls back to the asset's own `address`.
 *
 * @param token - Account asset to match.
 * @param chainId - Pay-token chain ID used for native address lookup.
 * @returns Address to compare, or `undefined` when unavailable.
 */
function tokenAddressForMatch(token: Asset, chainId: Hex): string | undefined {
  if (token.isNative) {
    try {
      return getNativeTokenAddress(chainId);
    } catch {
      return token.address;
    }
  }

  return token.address;
}

/**
 * Live pay-token balance from the funding account (accountOverride), not the
 * pay-controller snapshot. `paymentToken.balanceRaw` is taken once and can be
 * 0 / stale on money-account deposits — the confirmation `from` is the money
 * account, while funds come from the selected account. Comparing a real quote
 * against that snapshot marks every amount as insufficient.
 *
 * Mirrors mobile `usePayTokenAccountBalance`.
 */
export function usePayTokenAccountBalance(): {
  balanceUsd: string;
  balanceRaw: string;
} {
  const { payToken } = useTransactionPayToken();
  const accountTokens = useSendTokens({ includeNoBalance: true });
  const usdRate = useTokenFiatRate(
    (payToken?.address ?? ZERO_ADDRESS) as Hex,
    (payToken?.chainId ?? ABSENT_CHAIN_ID) as Hex,
    'usd',
  );

  return useMemo(() => {
    if (!payToken) {
      return { balanceUsd: '0', balanceRaw: '0' };
    }

    const payTokenChainId = toHexChainId(payToken.chainId);
    const matchingToken = accountTokens.find((token) => {
      if (toHexChainId(token.chainId) !== payTokenChainId) {
        return false;
      }

      const tokenAddress = tokenAddressForMatch(token, payToken.chainId);
      return tokenAddress?.toLowerCase() === payToken.address.toLowerCase();
    });

    if (!matchingToken?.rawBalance) {
      return {
        balanceUsd: payToken.balanceUsd ?? '0',
        balanceRaw: payToken.balanceRaw ?? '0',
      };
    }

    const balanceRaw = hexToDecimalString(matchingToken.rawBalance);
    if (new BigNumber(balanceRaw).isZero()) {
      return { balanceUsd: '0', balanceRaw: '0' };
    }

    const decimals = matchingToken.decimals ?? payToken.decimals ?? 18;
    const humanBalance = new BigNumber(balanceRaw).dividedBy(10 ** decimals);
    const snapshotUsd = new BigNumber(payToken.balanceUsd ?? '0');
    const computedUsd = usdRate
      ? humanBalance.times(String(usdRate))
      : new BigNumber(0);
    // `useTokenFiatRate` can return a non-USD unit (e.g. 1 × native rate).
    // Never report less USD than the Pay-with snapshot — that made every
    // non-Max deposit look insufficient while Max skipped the USD check.
    const balanceUsd = BigNumber.max(snapshotUsd, computedUsd).toString(10);

    return { balanceUsd, balanceRaw };
  }, [accountTokens, payToken, usdRate]);
}
