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
  energy: TronResource | null;
  bandwidth: TronResource | null;
  isLoading: boolean;
} => {
  const accountGroupAssets = useSelector(getAssetsBySelectedAccountGroup);
  const multichainBalances = useSelector(getMultichainBalances);
  const assetsMetadata = useSelector(getAssetsMetadata);

  return useMemo(() => {
    if (!account || !chainId) {
      return {
        energy: null,
        bandwidth: null,
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

    tronResources.forEach((resource) => {
      const assetId = resource.assetId as CaipAssetId;
      const balance = balances?.[assetId];
      if (!balance) return;

      const symbol = resource.symbol?.toLowerCase() || '';
      const value = parseFloat(balance.amount || '0');
      const isMax = symbol.includes('max');

      if (symbol.includes(TRON_RESOURCE.ENERGY)) {
        resourceData.energy[isMax ? 'max' : 'current'] = value;
      } else if (symbol.includes(TRON_RESOURCE.BANDWIDTH)) {
        resourceData.bandwidth[isMax ? 'max' : 'current'] = value;
      }
    });

    // Create resource objects with calculated percentages
    const createResource = (
      type: 'energy' | 'bandwidth',
      data: { current: number; max: number },
    ): TronResource | null => {
      if (data.current === 0 && data.max === 0) return null;
      return {
        type,
        current: data.current,
        max: data.max,
        percentage: data.max > 0 ? (data.current / data.max) * 100 : 0,
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
