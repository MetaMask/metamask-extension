import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetId } from '@metamask/keyring-api';
import { isTronResource } from '../../../../shared/lib/asset-utils';
import {
  getAssetsBySelectedAccountGroup,
  getAssetsMetadata,
} from '../../../selectors/assets';
import { getMultichainBalances } from '../../../selectors/multichain';
import { TRON_RESOURCE } from '../../../../shared/constants/multichain/assets';

export type TronResource = {
  type: 'energy' | 'bandwidth';
  current: number;
  max: number;
  percentage: number;
};

/**
 * Hook to fetch Tron resources (energy and bandwidth) for the selected account
 *
 * @param account - The internal account to fetch resources for
 * @param chainId - The Tron chain ID
 * @returns An object containing energy and bandwidth resources
 */
export const useTronResources = (
  account: InternalAccount | undefined,
  chainId: string,
): {
  energy: TronResource;
  bandwidth: TronResource;
  isLoading: boolean;
} => {
  const accountGroupAssets = useSelector(getAssetsBySelectedAccountGroup);
  const multichainBalances = useSelector(getMultichainBalances);
  const assetsMetadata = useSelector(getAssetsMetadata);

  return useMemo(() => {
    if (!account || !chainId) {
      return {
        energy: { type: 'energy' as const, current: 0, max: 1, percentage: 0 },
        bandwidth: {
          type: 'bandwidth' as const,
          current: 0,
          max: 1,
          percentage: 0,
        },
        isLoading: false,
      };
    }

    const assets = accountGroupAssets[chainId] || [];
    const balances = multichainBalances?.[account.id];
    const tronResources = assets.filter((asset) => isTronResource(asset));

    // Build resource data from assets
    const resourceData: {
      energy: { current: number; max: number; staked: number };
      bandwidth: { current: number; max: number; staked: number };
    } = {
      energy: { current: 0, max: 0, staked: 0 },
      bandwidth: { current: 0, max: 0, staked: 0 },
    };

    tronResources.forEach((resource) => {
      const assetId = resource.assetId as CaipAssetId;
      const balance = balances?.[assetId];
      if (!balance) return;

      const symbol = resource.symbol?.toLowerCase() || '';
      const value = parseFloat(balance.amount || '0');

      // Determine resource type and property
      const resourceType = symbol.includes(TRON_RESOURCE.ENERGY)
        ? 'energy'
        : symbol.includes(TRON_RESOURCE.BANDWIDTH)
          ? 'bandwidth'
          : null;

      if (!resourceType) return;

      const property = symbol.includes('strx')
        ? 'staked'
        : symbol.includes('max')
          ? 'max'
          : 'current';

      resourceData[resourceType][property] = value;
    });

    // Create resource objects with calculated percentages
    // Note: Total max includes both base max and staked resources (like mobile)
    // Always create resources even if values are 0 (accounts get free bandwidth)
    const createResource = (
      type: 'energy' | 'bandwidth',
      data: { current: number; max: number; staked: number },
    ): TronResource => {
      const totalMax = Math.max(1, data.max + data.staked);

      return {
        type,
        current: data.current,
        max: totalMax,
        percentage: (data.current / totalMax) * 100,
      };
    };

    return {
      energy: createResource('energy', resourceData.energy),
      bandwidth: createResource('bandwidth', resourceData.bandwidth),
      isLoading: false,
    };
  }, [
    account,
    chainId,
    accountGroupAssets,
    multichainBalances,
    assetsMetadata,
  ]);
};
