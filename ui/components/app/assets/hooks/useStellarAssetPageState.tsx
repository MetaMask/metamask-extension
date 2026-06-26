import { useMemo } from 'react';
import { type CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { XlmScope } from '@metamask/keyring-api';
import { AssetType } from '../../../../../shared/constants/transaction';
import { getBaseReserveFromExtra } from '../../../../helpers/stellar/base-reserve-from-extra';
import { isStellarClassicTrustlineInactiveForDisplay } from '../../../../helpers/stellar/trustline-from-extra';

type AccountAssetInfo = Record<string, unknown> | undefined;

/**
 * State about an asset in the context of Stellar classic trustlines.
 * Centralizes all Stellar-specific detection and parsing logic.
 */
export type StellarAssetPageState = {
  /** True if the chain is Stellar Pubnet */
  isStellarChainId: boolean;
  /** True if the asset is a SEP-41 (Stellar-native) token */
  isSep41StellarAsset: boolean;
  /** True if this is a classic trustline asset we should track */
  isStellarClassicTrustlineTrackedToken: boolean;
  /** True if the trustline is inactive/disabled */
  isStellarTrustlineInactive: boolean;
  /** True if we should show the activation card */
  showStellarClassicTrustlineActivate: boolean;
  /** True if this trustline exists and is active (can be removed) */
  hasStellarClassicTrustlineToRemove: boolean;
  /** Base reserve amount for Stellar native (or undefined if not applicable) */
  stellarNativeBaseReserve: string | undefined;
  /** True if we should show the special Stellar native balance section */
  showStellarNativeBalanceSection: boolean;
};

/**
 * Derive all Stellar-specific asset page state in one place.
 * This centralizes Stellar pubnet detection, SEP-41 detection, trustline tracking, etc.
 *
 * @param options - Stellar asset page state derivation options
 * @param options.chainId
 * @param options.assetId
 * @param options.type
 * @param options.assetWithBalance
 * @returns Object containing all computed Stellar state for the asset page
 */
export function useStellarAssetPageState({
  chainId,
  assetId,
  type,
  assetWithBalance,
}: {
  chainId: string;
  assetId: string;
  type: AssetType;
  assetWithBalance?:
    | {
        accountAssetInfo?: AccountAssetInfo;
        [key: string]: unknown;
      }
    | undefined;
}): StellarAssetPageState {
  return useMemo(() => {
    // Detect Stellar chain
    const isStellarChainId = chainId === XlmScope.Pubnet;

    // Parse SEP-41 status (only relevant on Stellar)
    let isSep41StellarAsset = false;
    if (assetId && isStellarChainId) {
      try {
        isSep41StellarAsset =
          parseCaipAssetType(assetId as CaipAssetType).assetNamespace === 'sep41';
      } catch {
        isSep41StellarAsset = false;
      }
    }

    // Determine if this is a classic trustline we're tracking
    const isStellarClassicTrustlineTrackedToken =
      isStellarChainId &&
      type === AssetType.token &&
      Boolean(assetId) &&
      !isSep41StellarAsset;

    // Check if the trustline is inactive
    const isStellarTrustlineInactive =
      isStellarClassicTrustlineTrackedToken &&
      isStellarClassicTrustlineInactiveForDisplay({
        chainId,
        assetId,
        isNative: type === AssetType.native,
        accountAssetInfo: assetWithBalance?.accountAssetInfo,
      });

    // Determine if we should show the activation card
    const showStellarClassicTrustlineActivate =
      isStellarClassicTrustlineTrackedToken && isStellarTrustlineInactive;

    // Check if trustline can be removed (exists and is active)
    const hasStellarClassicTrustlineToRemove =
      assetWithBalance !== undefined &&
      !isStellarClassicTrustlineInactiveForDisplay({
        chainId,
        assetId,
        isNative: type === AssetType.native,
        accountAssetInfo: assetWithBalance.accountAssetInfo,
      });

    // Get base reserve for Stellar native assets
    const stellarNativeBaseReserve =
      isStellarChainId && type === AssetType.native
        ? getBaseReserveFromExtra(assetWithBalance?.accountAssetInfo) ?? '0'
        : undefined;

    // Show the special Stellar native balance section
    const showStellarNativeBalanceSection =
      isStellarChainId && type === AssetType.native;

    return {
      isStellarChainId,
      isSep41StellarAsset,
      isStellarClassicTrustlineTrackedToken,
      isStellarTrustlineInactive,
      showStellarClassicTrustlineActivate,
      hasStellarClassicTrustlineToRemove,
      stellarNativeBaseReserve,
      showStellarNativeBalanceSection,
    };
  }, [chainId, assetId, type, assetWithBalance]);
}
