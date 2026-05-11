import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { isNativeAddress } from '@metamask/bridge-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  getPostQuoteWithdrawTransactionType,
  isPostQuoteWithdrawTransaction,
} from '../../../../../shared/lib/transactions.utils';
import { selectPayQuoteConfig } from '../../selectors/feature-flags';
import { useConfirmContext } from '../../context/confirm';
import type { Asset } from '../../types/send';
import { useSendTokens, type EnrichTokenRequest } from '../send/useSendTokens';

type WithdrawTokenFilterResult = {
  filterTokens: (tokens: Asset[]) => Asset[];
  isFilterApplied: boolean;
  isTokenAllowed: (chainId: string, address: string) => boolean;
};

/**
 * Returns a token filter for post-quote withdraw transactions backed by the
 * `confirmations_pay_post_quote` remote feature flag.
 */
export function usePostQuoteWithdrawTokenFilter(): WithdrawTokenFilterResult {
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | undefined
  >();
  const postQuoteWithdrawTransactionType =
    getPostQuoteWithdrawTransactionType(currentConfirmation);
  const isPostQuoteWithdraw =
    isPostQuoteWithdrawTransaction(currentConfirmation);

  const config = useSelector((state) =>
    selectPayQuoteConfig(state, postQuoteWithdrawTransactionType),
  );
  const allowlist = config.tokens;
  const isFilterApplied =
    isPostQuoteWithdraw && config.enabled === true && Boolean(allowlist);

  const tokenFilter = useMemo(() => {
    if (!isFilterApplied || !allowlist) {
      return undefined;
    }

    const lookup = buildAllowlistLookup(allowlist);

    return (chainId: string, address: string): boolean =>
      lookup.get(chainId.toLowerCase())?.has(address.toLowerCase()) ?? false;
  }, [allowlist, isFilterApplied]);

  const enrichTokenRequests = useMemo((): EnrichTokenRequest[] => {
    if (!isFilterApplied || !allowlist) {
      return [];
    }

    return Object.entries(allowlist).flatMap(([chainId, addresses]) =>
      addresses
        .filter((address) => !isNativeAddress(address.toLowerCase()))
        .map((address) => ({
          chainId: chainId as Hex,
          address,
        })),
    );
  }, [allowlist, isFilterApplied]);

  const walletTokens = useSendTokens({
    includeNoBalance: isFilterApplied,
    tokenFilter,
    enrichTokenRequests,
  });

  const filterTokens = useCallback(
    (tokens: Asset[]): Asset[] => {
      if (!isFilterApplied) {
        return tokens;
      }

      return walletTokens;
    },
    [isFilterApplied, walletTokens],
  );

  const isTokenAllowed = useCallback(
    (chainId: string, address: string): boolean =>
      Boolean(isFilterApplied && tokenFilter?.(chainId, address)),
    [isFilterApplied, tokenFilter],
  );

  return useMemo(
    () => ({
      filterTokens,
      isFilterApplied,
      isTokenAllowed,
    }),
    [filterTokens, isFilterApplied, isTokenAllowed],
  );
}

export const useWithdrawTokenFilter = usePostQuoteWithdrawTokenFilter;

function buildAllowlistLookup(
  allowlist: Record<Hex, Hex[]>,
): Map<string, Set<string>> {
  const lookup = new Map<string, Set<string>>();

  for (const [chainId, addresses] of Object.entries(allowlist)) {
    const lowerChainId = chainId.toLowerCase();
    const addressSet = new Set<string>();

    for (const address of addresses) {
      const lowerAddress = address.toLowerCase();
      addressSet.add(lowerAddress);

      if (isNativeAddress(lowerAddress)) {
        const nativeAddress = getNativeTokenAddress(lowerChainId as Hex);
        addressSet.add(nativeAddress.toLowerCase());
      }
    }

    lookup.set(lowerChainId, addressSet);
  }

  return lookup;
}
