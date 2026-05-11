import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Balance, CaipAssetId, CaipAssetType } from '@metamask/keyring-api';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { KeyringClient } from '@metamask/keyring-snap-client';
import { SnapId } from '@metamask/snaps-sdk';
import { isTronSpecialAsset } from '../../../../shared/lib/asset-utils';
import { getAssetsBySelectedAccountGroupWithTronSpecialAssets } from '../../../selectors/assets';
import { getMultichainBalances } from '../../../selectors/multichain';
import { getIsAssetsUnifyStateEnabled } from '../../../selectors/assets-unify-state';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../../../shared/constants/multichain/assets';
import { TRON_CHAINS } from '../../../../shared/constants/multichain/networks';
import { MultichainWalletSnapSender } from '../../../hooks/accounts/useMultichainWalletSnapClient';

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

const TRON_RESOURCE_CAIP_TYPES = [
  TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY,
  TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY,
  TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH,
  TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH,
];

const TRON_RESOURCE_BALANCES_QUERY_KEY_ROOT = [
  'metamask-extension',
  'tronResourceBalances',
  'v1',
] as const;

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
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);

  // When the unified AssetsController is enabled, the new SnapDataSource never
  // calls `onAssetsLookup` on the wallet snap, so the Tron resource assets
  // (energy/bandwidth and their daily maximums) end up without metadata in
  // `assetsInfo` and get filtered out of every downstream selector. To keep the
  // Tron daily-resources view working we bypass redux and ask the snap directly
  // for the balances using the same KeyringClient that the legacy
  // MultichainBalancesController used internally.
  const snapId = account?.metadata?.snap?.id;
  const accountId = account?.id;
  const isTronChain = TRON_CHAINS.includes(
    chainId as (typeof TRON_CHAINS)[number],
  );
  const directFetchEnabled = Boolean(
    isAssetsUnifyStateEnabled && accountId && chainId && isTronChain && snapId,
  );

  const queryKey = useMemo(
    () =>
      [
        ...TRON_RESOURCE_BALANCES_QUERY_KEY_ROOT,
        snapId,
        accountId,
        chainId,
      ] as const,
    [snapId, accountId, chainId],
  );

  const { data: directBalances } = useQuery({
    queryKey,
    queryFn: async (): Promise<Record<string, Balance>> => {
      // `enabled` above guarantees snapId, accountId, and chainId are defined when queryFn runs.
      const assetIds = TRON_RESOURCE_CAIP_TYPES.map(
        (caipType) => `${chainId}/${caipType}` as CaipAssetType,
      );
      const client = new KeyringClient(
        new MultichainWalletSnapSender(snapId as SnapId),
      );
      return (await client.getAccountBalances(
        accountId as string,
        assetIds,
      )) as Record<string, Balance>;
    },
    enabled: directFetchEnabled,
    retry: false,
  });

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

    const assets = accountGroupAssets[chainId] || [];
    const balances = multichainBalances?.[account.id];
    const tronSpecialAssets = assets.filter((asset) =>
      isTronSpecialAsset(asset.assetId),
    );

    const findByCaipType = (caipType: string) =>
      tronSpecialAssets.find(
        (asset) => getAssetCaipType(asset.assetId) === caipType,
      );

    const getBalanceForCaipType = (caipType: string): number => {
      // Prefer the value we fetched directly from the snap (when the new
      // AssetsController has stripped it from redux state).
      const directAssetId = `${chainId}/${caipType}` as CaipAssetId;
      const direct = directBalances?.[directAssetId];
      if (direct?.amount) {
        return parseFloat(direct.amount);
      }

      const asset = findByCaipType(caipType);
      if (!asset) {
        return 0;
      }
      return parseFloat(
        balances?.[asset.assetId as CaipAssetId]?.amount || '0',
      );
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
    accountGroupAssets,
    multichainBalances,
    directBalances,
  ]);
};
