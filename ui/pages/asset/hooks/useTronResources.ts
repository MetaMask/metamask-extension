import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Balance, CaipAssetId, CaipAssetType } from '@metamask/keyring-api';
import { KeyringClient } from '@metamask/keyring-snap-client';
import { SnapId } from '@metamask/snaps-sdk';
import { isTronSpecialAsset } from '../../../../shared/lib/asset-utils';
import { getAssetsBySelectedAccountGroupWithTronSpecialAssets } from '../../../selectors/assets';
import { getMultichainBalances } from '../../../selectors/multichain';
import { getIsAssetsUnifyStateEnabled } from '../../../selectors/assets-unify-state';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../../../shared/constants/multichain/assets';
import { TRON_CHAINS } from '../../../../shared/constants/multichain/networks';
import { MultichainWalletSnapSender } from '../../../hooks/accounts/useMultichainWalletSnapSender';

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
 * Internal hook that fetches Tron resource balances directly from the Tron
 * wallet snap. Used when the unified AssetsController is enabled, because the
 * new SnapDataSource does not call `onAssetsLookup` and therefore the resource
 * assets (energy, bandwidth and their daily maximums) are stripped from state.
 * @param account
 * @param chainId
 * @param enabled
 */
const useSnapTronBalances = (
  account: InternalAccount | undefined,
  chainId: string,
  enabled: boolean,
): Record<CaipAssetId, Balance> | undefined => {
  const snapId = account?.metadata?.snap?.id;
  const accountId = account?.id;
  const isTronChain = TRON_CHAINS.includes(
    chainId as (typeof TRON_CHAINS)[number],
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

  const { data } = useQuery({
    queryKey,
    queryFn: async (): Promise<Record<string, Balance>> => {
      // `enabled` guarantees snapId, accountId, and chainId are defined here.
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
    enabled: enabled && Boolean(accountId && chainId && isTronChain && snapId),
    retry: false,
  });

  return data as Record<CaipAssetId, Balance> | undefined;
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

  // Both hooks are always called (no conditional hook calls). The inactive
  // path is a no-op: useQuery with enabled:false returns undefined immediately,
  // and useMultichainStateTronBalances returns a stable empty map when data is absent.
  // When the feature flag is removed, delete useMultichainStateTronBalances and its call,
  // and drop the isAssetsUnifyStateEnabled ternary below.
  const multichainStateBalances = useMultichainStateTronBalances(
    account,
    chainId,
  );
  const snapBalances = useSnapTronBalances(
    account,
    chainId,
    isAssetsUnifyStateEnabled,
  );

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
      ? snapBalances
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
    snapBalances,
  ]);
};
