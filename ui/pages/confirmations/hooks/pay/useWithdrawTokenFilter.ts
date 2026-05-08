import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { isNativeAddress } from '@metamask/bridge-controller';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { isPerpsWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { selectPayQuoteConfig } from '../../selectors/feature-flags';
import { useConfirmContext } from '../../context/confirm';
import type { Asset } from '../../types/send';
import {
  useSendTokens,
  type EnrichTokenRequest,
} from '../send/useSendTokens';

type WithdrawTokenFilterResult = {
  filterTokens: (tokens: Asset[]) => Asset[];
  isFilterApplied: boolean;
};

/**
 * Returns a token filter for withdraw transactions backed by the
 * `confirmations_pay_post_quote` remote feature flag.
 */
export function useWithdrawTokenFilter(): WithdrawTokenFilterResult {
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | undefined
  >();
  const isWithdraw = isPerpsWithdrawTransaction(currentConfirmation);
  const transactionType = isWithdraw
    ? TransactionType.perpsWithdraw
    : currentConfirmation?.type;

  const config = useSelector((state) =>
    selectPayQuoteConfig(state, transactionType),
  );
  const allowlist = config.tokens;
  const isFilterApplied = isWithdraw && Boolean(allowlist);

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
    enabled: isFilterApplied,
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

  return useMemo(
    () => ({
      filterTokens,
      isFilterApplied,
    }),
    [filterTokens, isFilterApplied],
  );
}

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
