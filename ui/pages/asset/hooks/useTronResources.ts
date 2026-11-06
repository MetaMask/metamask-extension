import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Balance, CaipAssetId } from '@metamask/keyring-api';
import type { CaipChainId } from '@metamask/utils';
import { getAssetsBalance } from '../../../selectors/assets';
import {
  getTronNativeAssetId,
  getTronResourcesFromMetadata,
  getTronResourcesFromSpecialAssetBalances,
  hasTronSpecialAssetBalances,
} from '../../../../shared/lib/tron-resources';

const TronResourceType = {
  ENERGY: 'energy',
  BANDWIDTH: 'bandwidth',
} as const;

type TronResourceType =
  (typeof TronResourceType)[keyof typeof TronResourceType];

export type TronResource = {
  type: TronResourceType;
  current: number;
  max: number;
  percentage: number;
};

/**
 * Data availability state for Tron resources:
 * - `loading`: no data has been fetched yet, nothing should be rendered for
 * the resources themselves.
 * - `available`: energy and bandwidth values were fetched and are valid
 * numbers (a real zero is valid data).
 * - `unavailable`: data was fetched but energy and/or bandwidth values are
 * null or malformed, so they cannot be shown.
 */
export type TronResourcesDataState = 'loading' | 'available' | 'unavailable';

/**
 * Internal hook that reads Tron resource balances from the unified
 * AssetsController state.
 *
 * @param account
 */
const useAssetsControllerTronBalances = (
  account: InternalAccount | undefined,
): Record<CaipAssetId, Balance> => {
  const assetsBalance = useSelector(getAssetsBalance);

  return useMemo(() => {
    if (!account) {
      return {} as Record<CaipAssetId, Balance>;
    }

    return (assetsBalance[account.id] ?? {}) as Record<CaipAssetId, Balance>;
  }, [account, assetsBalance]);
};

/**
 * Hook to fetch Tron resources (energy and bandwidth) for the selected account
 *
 * Values are read from the metadata of the TRX native balance entry when
 * present, falling back to the Tron special-asset balance entries for any
 * value the metadata does not provide.
 *
 * @param account - The internal account to fetch resources for
 * @param chainId - The Tron chain ID
 * @returns The energy and bandwidth resources and the data availability state
 */
export const useTronResources = (
  account: InternalAccount | undefined,
  chainId: CaipChainId,
): {
  energy: TronResource;
  bandwidth: TronResource;
  dataState: TronResourcesDataState;
} => {
  const assetsControllerBalances = useAssetsControllerTronBalances(account);

  return useMemo(() => {
    const createDefaultResource = (type: TronResourceType): TronResource => ({
      type,
      current: 0,
      max: 0,
      percentage: 0,
    });

    const defaultResult = {
      energy: createDefaultResource(TronResourceType.ENERGY),
      bandwidth: createDefaultResource(TronResourceType.BANDWIDTH),
      dataState: 'loading' as TronResourcesDataState,
    };

    if (!account || !chainId) {
      return defaultResult;
    }

    const nativeAssetId = getTronNativeAssetId(chainId);
    const trxBalance = assetsControllerBalances[nativeAssetId];
    const metadataSnapshot = getTronResourcesFromMetadata(trxBalance?.metadata);
    const specialAssetsSnapshot = getTronResourcesFromSpecialAssetBalances(
      assetsControllerBalances,
      chainId,
    );

    // Metadata values win; special-asset balances fill in any value the
    // metadata does not provide.
    const energyCurrent =
      metadataSnapshot?.energy.current ?? specialAssetsSnapshot.energy.current;
    const energyMax =
      metadataSnapshot?.energy.max ?? specialAssetsSnapshot.energy.max;
    const bandwidthCurrent =
      metadataSnapshot?.bandwidth.current ??
      specialAssetsSnapshot.bandwidth.current;
    const bandwidthMax =
      metadataSnapshot?.bandwidth.max ?? specialAssetsSnapshot.bandwidth.max;

    const isComplete =
      energyCurrent !== null &&
      energyMax !== null &&
      bandwidthCurrent !== null &&
      bandwidthMax !== null;

    // A bare TRX balance entry is not evidence that resource data was
    // fetched and is missing: its metadata may not have arrived yet, so it
    // must not flip the state to `unavailable` mid-fetch.
    const hasData =
      Boolean(metadataSnapshot) ||
      hasTronSpecialAssetBalances(assetsControllerBalances, chainId);

    let dataState: TronResourcesDataState = 'loading';
    if (isComplete) {
      dataState = 'available';
    } else if (hasData) {
      dataState = 'unavailable';
    }

    const createResource = (
      type: TronResourceType,
      current: number = 0,
      max: number = 0,
    ): TronResource => ({
      type,
      current,
      max,
      percentage: (current / Math.max(1, max)) * 100,
    });

    return {
      energy: createResource(
        TronResourceType.ENERGY,
        energyCurrent ?? 0,
        energyMax ?? 0,
      ),
      bandwidth: createResource(
        TronResourceType.BANDWIDTH,
        bandwidthCurrent ?? 0,
        bandwidthMax ?? 0,
      ),
      dataState,
    };
  }, [account, chainId, assetsControllerBalances]);
};
