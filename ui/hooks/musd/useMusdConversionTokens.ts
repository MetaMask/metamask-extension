/**
 * useMusdConversionTokens Hook
 *
 * The source of truth for the tokens that are eligible for mUSD conversion.
 * Filters tokens based on allowlist/blocklist rules AND minimum balance requirements.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionTokens.ts
 */

import { toHex } from '@metamask/controller-utils';
import type { Hex } from '@metamask/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isMusdSupportedChain } from '../../components/app/musd/constants';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import {
  type Asset,
  AssetStandard,
} from '../../pages/confirmations/types/send';
import {
  getIsMultichainAccountsState2Enabled,
  getSelectedAccount,
} from '../../selectors';
import {
  getAssetsBySelectedAccountGroup,
  getTokenBalancesEvm,
} from '../../selectors/assets';
import {
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdMinAssetBalanceRequired,
} from '../../selectors/musd';
import { checkTokenAllowed } from '../../components/app/musd/utils/token-allowlist';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';

// ============================================================================
// Types
// ============================================================================

/**
 * Token type that can be used with this hook
 */
export type ConversionToken = {
  address: string;
  chainId: string;
  symbol: string;
  fiat?: { balance?: number | null };
  tokenFiatAmount?: number | null;
};

/**
 * Type for the token filter function that operates on Asset type
 */
export type TokenFilterFn = (tokens: Asset[]) => Asset[];

/**
 * Return type for useMusdConversionTokens hook
 */
export type UseMusdConversionTokensResult = {
  /** Filter function that filters tokens to only mUSD-eligible ones */
  filterAllowedTokens: <TToken extends ConversionToken>(
    tokens: TToken[],
  ) => TToken[];
  /** Filter Asset tokens by ERC20 standard + allowlist/blocklist + min balance */
  filterTokens: TokenFilterFn;
  /** Check if a specific token is eligible for mUSD conversion */
  isConversionToken: (token?: ConversionToken) => boolean;
  /** Check if mUSD is supported on a given chain */
  isMusdSupportedOnChain: (chainId?: string) => boolean;
  /** Check if there are convertible tokens on a given chain */
  hasConvertibleTokensByChainId: (chainId: Hex) => boolean;
  /** The tokens that are eligible for mUSD conversion */
  tokens: TokenWithFiatAmount[];
  /** The best default payment token for the current network selection */
  defaultPaymentToken: { address: string; chainId: Hex } | null;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely format a chain ID to hex format
 *
 * @param chainId
 */
function safeFormatChainIdToHex(chainId: string | number | undefined): Hex {
  if (!chainId) {
    return '0x0' as Hex;
  }
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    return chainId.toLowerCase() as Hex;
  }
  return toHex(chainId) as Hex;
}

/**
 * Get fiat balance from a token, handling different property names
 *
 * @param token
 */
function getTokenFiatBalance(token: ConversionToken): number | null {
  // Try tokenFiatAmount first (extension format)
  if (token.tokenFiatAmount !== undefined && token.tokenFiatAmount !== null) {
    return token.tokenFiatAmount;
  }
  // Try fiat.balance (mobile format)
  if (token.fiat?.balance !== undefined && token.fiat?.balance !== null) {
    return token.fiat.balance;
  }
  return null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * The source of truth for the tokens that are eligible for mUSD conversion.
 *
 * @returns Object containing:
 * - filterAllowedTokens(tokens): Filters tokens based on allowlist/blocklist and min balance.
 * - isConversionToken(token): Checks if a token is eligible for mUSD conversion.
 * - isMusdSupportedOnChain(chainId): Checks if mUSD is supported on a given chain.
 * - hasConvertibleTokensByChainId(chainId): Checks if there are convertible tokens on a given chain.
 * - tokens: The tokens that are eligible for mUSD conversion.
 */
export function useMusdConversionTokens(): UseMusdConversionTokensResult {
  const { selectedChainId } = useMusdNetworkFilter();

  // Get feature flag values
  const allowlist = useSelector(selectMusdConvertibleTokensAllowlist);
  const blocklist = useSelector(selectMusdConvertibleTokensBlocklist);
  const minAssetBalanceRequired = useSelector(
    selectMusdMinAssetBalanceRequired,
  );

  // Get account tokens
  const selectedAccount = useSelector(getSelectedAccount);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // Get tokens using the appropriate selector
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount?.address ?? ''),
  );
  const accountGroupAssets = useSelector(getAssetsBySelectedAccountGroup);

  // Get all account tokens
  const allTokens = useMemo((): TokenWithFiatAmount[] => {
    if (isMultichainAccountsState2Enabled) {
      // Flatten account group assets; only include assets with address (EVM tokens)
      // so the result satisfies TokenWithFiatAmount (BaseToken requires address)
      const flattened = Object.entries(accountGroupAssets).flatMap(
        ([chainId, assets]) =>
          (assets ?? [])
            .filter(
              (a) =>
                'address' in a &&
                typeof (a as { address: unknown }).address === 'string',
            )
            .map((a) => {
              const asset = a as typeof a & { address: string };
              return {
                ...asset,
                address: asset.address as Hex,
                secondary: 0,
                title: asset.name ?? asset.symbol ?? '',
                chainId: chainId as Hex,
                tokenFiatAmount: asset.fiat?.balance ?? 0,
              };
            }),
      );
      return flattened as TokenWithFiatAmount[];
    }
    // Use EVM balances for legacy mode
    return evmBalances ?? [];
  }, [isMultichainAccountsState2Enabled, accountGroupAssets, evmBalances]);

  /**
   * Filter tokens with minimum balance requirement
   * Uses plain number comparison.
   */
  const filterTokensWithMinBalance = useCallback(
    <TToken extends ConversionToken>(token: TToken): boolean => {
      const fiatBalance = getTokenFiatBalance(token);

      // Can't use truthiness checks here, because `0` is valid when threshold is '0'
      if (fiatBalance === undefined || fiatBalance === null) {
        return false;
      }

      const num = Number(fiatBalance);
      if (!Number.isFinite(num)) {
        return false;
      }

      return num >= minAssetBalanceRequired;
    },
    [minAssetBalanceRequired],
  );

  /**
   * Filter tokens with allowlist and blocklist
   */
  const filterTokensWithAllowlistAndBlocklist = useCallback(
    <TToken extends ConversionToken>(token: TToken): boolean =>
      checkTokenAllowed(token.symbol, allowlist, blocklist, token.chainId),
    [allowlist, blocklist],
  );

  /**
   * Filter tokens based on allowlist/blocklist and minimum balance
   */
  const filterAllowedTokens = useCallback(
    <TToken extends ConversionToken>(tokens: TToken[]): TToken[] =>
      tokens
        .filter((token) => filterTokensWithAllowlistAndBlocklist(token))
        .filter((token) => filterTokensWithMinBalance(token)),
    [filterTokensWithAllowlistAndBlocklist, filterTokensWithMinBalance],
  );

  // Get the list of eligible conversion tokens
  const conversionTokens = useMemo(() => {
    try {
      return filterAllowedTokens(allTokens);
    } catch {
      return [];
    }
  }, [allTokens, filterAllowedTokens]);

  const defaultPaymentToken = useMemo(() => {
    if (conversionTokens.length === 0) {
      return null;
    }

    const paymentToken = selectedChainId
      ? conversionTokens.find(
          (token) =>
            token.chainId &&
            safeFormatChainIdToHex(token.chainId) === selectedChainId,
        )
      : conversionTokens[0];

    if (!paymentToken?.chainId || !paymentToken?.address) {
      return null;
    }

    const chainIdHex = safeFormatChainIdToHex(paymentToken.chainId);
    if (!chainIdHex.startsWith('0x')) {
      return null;
    }

    return {
      address: toChecksumHexAddress(paymentToken.address),
      chainId: chainIdHex as Hex,
    };
  }, [conversionTokens, selectedChainId]);

  /**
   * Check if there are convertible tokens on a specific chain
   */
  const hasConvertibleTokensByChainId = useCallback(
    (chainId: Hex): boolean =>
      conversionTokens.some(
        (token) =>
          token.chainId &&
          safeFormatChainIdToHex(token.chainId) ===
            safeFormatChainIdToHex(chainId),
      ),
    [conversionTokens],
  );

  /**
   * Check if a specific token is eligible for mUSD conversion
   */
  const isConversionToken = useCallback(
    (token?: ConversionToken): boolean => {
      if (!token) {
        return false;
      }

      if (!token.chainId) {
        return false;
      }

      const tokenChainId = safeFormatChainIdToHex(token.chainId);

      return conversionTokens.some(
        (musdToken) =>
          token.address.toLowerCase() === musdToken.address.toLowerCase() &&
          musdToken.chainId &&
          safeFormatChainIdToHex(musdToken.chainId) === tokenChainId,
      );
    },
    [conversionTokens],
  );

  /**
   * Check if mUSD is supported on a given chain.
   * Delegates to isMusdSupportedChain from constants after normalizing chainId to hex.
   */
  const isMusdSupportedOnChain = useCallback((chainId?: string): boolean => {
    if (!chainId) {
      return false;
    }
    const hexChainId = safeFormatChainIdToHex(chainId);
    return isMusdSupportedChain(hexChainId);
  }, []);

  /**
   * Filter Asset tokens by ERC20 standard, allowlist/blocklist, and min balance.
   * Designed for use in the pay-with modal where tokens are Asset type.
   */
  const filterTokens: TokenFilterFn = useCallback(
    (tokens: Asset[]): Asset[] =>
      tokens.filter((token) => {
        if (token.standard && token.standard !== AssetStandard.ERC20) {
          return false;
        }

        if (!token.symbol || !token.chainId) {
          return false;
        }

        const asConversion: ConversionToken = {
          address: token.address ?? '',
          chainId: String(token.chainId),
          symbol: token.symbol,
          fiat: token.fiat,
        };

        return (
          filterTokensWithAllowlistAndBlocklist(asConversion) &&
          filterTokensWithMinBalance(asConversion)
        );
      }),
    [filterTokensWithAllowlistAndBlocklist, filterTokensWithMinBalance],
  );

  return useMemo(
    () => ({
      filterAllowedTokens,
      filterTokens,
      isConversionToken,
      isMusdSupportedOnChain,
      hasConvertibleTokensByChainId,
      tokens: conversionTokens,
      defaultPaymentToken,
    }),
    [
      filterAllowedTokens,
      filterTokens,
      isConversionToken,
      isMusdSupportedOnChain,
      hasConvertibleTokensByChainId,
      conversionTokens,
      defaultPaymentToken,
    ],
  );
}

export default useMusdConversionTokens;
