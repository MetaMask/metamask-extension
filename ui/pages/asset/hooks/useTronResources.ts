import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetId } from '@metamask/keyring-api';
import { isTronResource } from '../../../../shared/lib/asset-utils';
import { getAssetsBySelectedAccountGroup } from '../../../selectors/assets';
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
      energy: { current: number; max: number };
      bandwidth: { current: number; max: number };
    } = {
      energy: { current: 0, max: 0 },
      bandwidth: { current: 0, max: 0 },
    };

    Object.keys(resourceData).forEach((resourceType) => {
      const resource = tronResources.find(
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (resource) => resource.symbol?.toLowerCase() === resourceType,
      );
      const max = tronResources.find(
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (resource) => resource.symbol?.toLowerCase() === `max-${resourceType}`,
      );

      resourceData[resourceType as keyof typeof resourceData] = {
        current: resource
          ? parseFloat(
              balances?.[resource.assetId as CaipAssetId]?.amount || '0',
            )
          : 0,
        max: max
          ? parseFloat(balances?.[max.assetId as CaipAssetId]?.amount || '0')
          : 0,
      };
    });

    // Create resource objects with calculated percentages
    // Always create resources even if values are 0 (accounts get free bandwidth)
    const createResource = (
      type: 'energy' | 'bandwidth',
      data: { current: number; max: number },
    ): TronResource => {
      const totalMax = Math.max(1, data.max);

      return {
        type,
        current: data.current,
        max: totalMax,
        percentage: (data.current / totalMax) * 100,
      };
    };

    return {
      energy: createResource(TRON_RESOURCE.ENERGY, resourceData.energy),
      bandwidth: createResource(
        TRON_RESOURCE.BANDWIDTH,
        resourceData.bandwidth,
      ),
      isLoading: false,
    };
  }, [account, chainId, accountGroupAssets, multichainBalances]);
};
