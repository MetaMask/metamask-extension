import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Balance, CaipAssetId } from '@metamask/keyring-api';
import { isTronSpecialAsset } from '../../../../shared/lib/asset-utils';
import {
  getAssetsBalance,
  getAssetsBySelectedAccountGroupWithTronSpecialAssets,
} from '../../../selectors/assets';
import { getMultichainBalances } from '../../../selectors/multichain';
import { getIsAssetsUnifyStateEnabled } from '../../../selectors/assets-unify-state';
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

/**
 * Internal hook that reads Tron resource balances from state.
 * This is the legacy data path, used when the unified AssetsController
 * feature flag is disabled.
 * @param account
 * @param chainId
 */
const useMultichainStateTronBalances = (
  account: InternalAccount | undefined,
  chainId: string,
): Record<CaipAssetId, Balance> => {
  const accountGroupAssets = useSelector(
    getAssetsBySelectedAccountGroupWithTronSpecialAssets,
  );
  const multichainBalances = useSelector(getMultichainBalances);

  return useMemo(() => {
    if (!account || !chainId) {
      return {} as Record<CaipAssetId, Balance>;
    }

    const assets = accountGroupAssets[chainId] || [];
    const accountBalances = multichainBalances?.[account.id];
    const tronSpecialAssets = assets.filter((asset) =>
      isTronSpecialAsset(asset.assetId),
    );

    return Object.fromEntries(
      tronSpecialAssets.map((asset) => [
        asset.assetId,
        accountBalances?.[asset.assetId as CaipAssetId] ?? {
          amount: '0',
          unit: '',
        },
      ]),
    ) as Record<CaipAssetId, Balance>;
  }, [account, chainId, accountGroupAssets, multichainBalances]);
};

/**
 * Internal hook that reads Tron resource balances from the unified
 * AssetsController state.
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
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);

  const multichainStateBalances = useMultichainStateTronBalances(
    account,
    chainId,
  );
  const assetsControllerBalances = useAssetsControllerTronBalances(account);

  return useMemo(() => {
    const defaultResources = {
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

    if (!account || !chainId) {
      return defaultResources;
    }

    const balances = isAssetsUnifyStateEnabled
      ? assetsControllerBalances
      : multichainStateBalances;

    const getBalanceForCaipType = (caipType: string): number => {
      const assetId = `${chainId}/${caipType}` as CaipAssetId;
      return Number.parseFloat(balances?.[assetId]?.amount || '0');
    };

    const energyData = {
      current: getBalanceForCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY),
      max: getBalanceForCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY),
    };

    const bandwidthData = {
      current: getBalanceForCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH),
      max: getBalanceForCaipType(
        TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH,
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
  }, [
    account,
    chainId,
    isAssetsUnifyStateEnabled,
    multichainStateBalances,
    assetsControllerBalances,
  ]);
};
