import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAssetId } from '@metamask/keyring-api';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { isTronSpecialAsset } from '../../../../shared/lib/asset-utils';
import { getAssetsBySelectedAccountGroupWithTronSpecialAssets } from '../../../selectors/assets';
import { getMultichainBalances } from '../../../selectors/multichain';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../../../shared/constants/multichain/assets';

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

const getAssetCaipType = (assetId: string): string | undefined => {
  if (!isCaipAssetType(assetId)) {
    return undefined;
  }
  const { assetNamespace, assetReference } = parseCaipAssetType(assetId);
  return `${assetNamespace}:${assetReference}`;
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
} => {
  const accountGroupAssets = useSelector(
    getAssetsBySelectedAccountGroupWithTronSpecialAssets,
  );
  const multichainBalances = useSelector(getMultichainBalances);

  return useMemo(() => {
    if (!account || !chainId) {
      return {
        energy: {
          type: TronResourceType.ENERGY,
          current: 0,
          max: 0,
          percentage: 0,
        },
        bandwidth: {
          type: TronResourceType.BANDWIDTH,
          current: 0,
          max: 0,
          percentage: 0,
        },
      };
    }

    const assets = accountGroupAssets[chainId] || [];
    const balances = multichainBalances?.[account.id];
    const tronSpecialAssets = assets.filter((asset) =>
      isTronSpecialAsset(asset.assetId),
    );

    const findByCaipType = (caipType: string) =>
      tronSpecialAssets.find(
        (asset) => getAssetCaipType(asset.assetId) === caipType,
      );

    const getBalance = (asset: (typeof tronSpecialAssets)[0] | undefined) =>
      asset
        ? parseFloat(balances?.[asset.assetId as CaipAssetId]?.amount || '0')
        : 0;

    const energyData = {
      current: getBalance(findByCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY)),
      max: getBalance(
        findByCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY),
      ),
    };

    const bandwidthData = {
      current: getBalance(
        findByCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH),
      ),
      max: getBalance(
        findByCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH),
      ),
    };

    const createResource = (
      type: TronResourceType,
      data: { current: number; max: number },
    ): TronResource => {
      const divisor = Math.max(1, data.max);
      return {
        type,
        current: data.current,
        max: data.max,
        percentage: (data.current / divisor) * 100,
      };
    };

    return {
      energy: createResource(TronResourceType.ENERGY, energyData),
      bandwidth: createResource(TronResourceType.BANDWIDTH, bandwidthData),
    };
  }, [account, chainId, accountGroupAssets, multichainBalances]);
};
