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
  /**
   * True when the balances above come from the funding account's own token
   * list. False means they are the controller snapshot fallback, which can
   * still describe a previously selected funding account — callers that treat
   * the balance as on-chain truth (Max / uncapped prefill) must check this.
   */
  isLiveBalance: boolean;
  /**
   * Whether `balanceUsd` is a real figure rather than a placeholder zero.
   *
   * `balanceUsd` is `'0'` both when the account genuinely holds nothing and
   * when we cannot value the holding yet — no pay token selected, the fiat
   * rate has not arrived, or only a `0` controller snapshot is available
   * (routine on money-account deposits, whose transaction `from` is the money
   * account rather than the funding account). Callers that would block on a
   * zero balance must treat `false` as "unknown" and stay silent, otherwise
   * selecting a different account or token flashes a false
   * insufficient-funds error for the render or two before the real balance
   * lands.
   */
  isBalanceUsdKnown: boolean;
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
      return {
        balanceUsd: '0',
        balanceRaw: '0',
        isLiveBalance: false,
        isBalanceUsdKnown: false,
      };
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
      // Snapshot fallback: a positive USD snapshot is a usable figure, but a
      // `0`/absent one is indistinguishable from "not fetched yet" and must
      // not be treated as a known-zero balance.
      const snapshotBalanceUsd = payToken.balanceUsd ?? '0';
      return {
        balanceUsd: snapshotBalanceUsd,
        balanceRaw: payToken.balanceRaw ?? '0',
        isLiveBalance: false,
        isBalanceUsdKnown: new BigNumber(snapshotBalanceUsd).gt(0),
      };
    }

    const balanceRaw = hexToDecimalString(matchingToken.rawBalance);
    if (new BigNumber(balanceRaw).isZero()) {
      // The funding account's own token list says zero, so this is a real
      // balance rather than a gap in our data.
      return {
        balanceUsd: '0',
        balanceRaw: '0',
        isLiveBalance: true,
        isBalanceUsdKnown: true,
      };
    }

    const decimals = matchingToken.decimals ?? payToken.decimals ?? 18;
    const humanBalance = new BigNumber(balanceRaw).dividedBy(10 ** decimals);
    const snapshotUsd = new BigNumber(payToken.balanceUsd ?? '0');
    const computedUsd = usdRate
      ? humanBalance.times(String(usdRate))
      : new BigNumber(0);

    // Spendable USD must not exceed the Pay-with snapshot or the live
    // raw×rate figure. Taking max() inflated Max/prefill above the displayed
    // balance (e.g. $55.7 vs Pay with $54.71) so quotes failed while tapping
    // Max later (after balances aligned) worked.
    //
    // When the live rate is missing or clearly broken (computed ≪ snapshot),
    // keep the snapshot so insufficient-funds checks do not false-positive.
    let balanceUsd: string;
    if (!usdRate || computedUsd.lte(0)) {
      balanceUsd = snapshotUsd.toString(10);
    } else if (snapshotUsd.gt(0)) {
      balanceUsd = BigNumber.min(snapshotUsd, computedUsd).toString(10);
    } else {
      balanceUsd = computedUsd.toString(10);
    }

    // The raw balance is positive here, so a `0` USD value means we could not
    // value it yet (no fiat rate and no snapshot) rather than "no funds".
    return {
      balanceUsd,
      balanceRaw,
      isLiveBalance: true,
      isBalanceUsdKnown: new BigNumber(balanceUsd).gt(0),
    };
  }, [accountTokens, payToken, usdRate]);
}
