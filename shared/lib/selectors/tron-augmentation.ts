import { AssetsControllerState } from '@metamask/assets-controller';
import {
  CaipAssetType,
  KnownCaipNamespace,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  TRON_SPECIAL_ASSET_CAIP_TYPES,
  type TronSpecialAssetCaipType,
} from '../../constants/multichain/assets';

/**
 * Tron Augmentation Module
 *
 * The Tron Snap reports virtual resource and staking-state assets (Energy,
 * Bandwidth, staked TRX, and so on) as balances, but the unified
 * `AssetsController` only persists `assetsInfo` metadata for real, priceable
 * tokens. The legacy `MultichainAssetsController` did carry metadata for these
 * resources, so while it was the source of truth every consumer saw them.
 *
 * Anything downstream that pairs a balance with its metadata therefore drops
 * these assets, because `assetsInfo` has no entry to pair them with. The
 * resources are fully described by their asset ID, so the client can supply
 * the metadata itself rather than waiting for it to be persisted.
 *
 * This augmentation is the hotfix shape: it takes unified state and returns
 * unified state with the missing `assetsInfo` entries filled in, so consumers
 * need no Tron-specific branching. The durable fix is for the Tron Snap to
 * report this metadata so `AssetsController` persists it.
 */

const TRON_RESOURCE_ICON_URL =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png';

type TronResourceDescriptor = {
  name: string;
  symbol: string;
  decimals: number;
};

/**
 * Mirrors the metadata the legacy `MultichainAssetsController` persisted for
 * each resource, so consumers see the same symbols, names, and decimals they
 * saw before the legacy controllers were deprecated.
 */
const TRON_RESOURCE_DESCRIPTORS: Record<
  TronSpecialAssetCaipType,
  TronResourceDescriptor
> = {
  [TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY]: {
    name: 'Energy',
    symbol: 'ENERGY',
    decimals: 0,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH]: {
    name: 'Bandwidth',
    symbol: 'BANDWIDTH',
    decimals: 0,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY]: {
    name: 'Max Energy',
    symbol: 'MAX-ENERGY',
    decimals: 0,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH]: {
    name: 'Max Bandwidth',
    symbol: 'MAX-BANDWIDTH',
    decimals: 0,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.STAKED_FOR_ENERGY]: {
    name: 'Staked for Energy',
    symbol: 'sTRX-ENERGY',
    decimals: 6,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.STAKED_FOR_BANDWIDTH]: {
    name: 'Staked for Bandwidth',
    symbol: 'sTRX-BANDWIDTH',
    decimals: 6,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.READY_FOR_WITHDRAWAL]: {
    name: 'Ready for Withdrawal',
    symbol: 'trx-ready-for-withdrawal',
    decimals: 6,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.STAKING_REWARDS]: {
    name: 'Staking Rewards',
    symbol: 'trx-staking-rewards',
    decimals: 6,
  },
  [TRON_SPECIAL_ASSET_CAIP_TYPES.IN_LOCK_PERIOD]: {
    name: 'In Lock Period',
    symbol: 'trx-in-lock-period',
    decimals: 6,
  },
};

/**
 * Builds the `assetsInfo` entry for a Tron resource asset.
 *
 * @param assetId - The CAIP asset ID to describe.
 * @returns The metadata entry, or undefined when the asset is not a Tron resource.
 */
function getTronResourceAssetInfo(assetId: CaipAssetType) {
  const { chain, assetNamespace, assetReference } = parseCaipAssetType(assetId);

  if (chain.namespace !== KnownCaipNamespace.Tron) {
    return undefined;
  }

  const descriptor =
    TRON_RESOURCE_DESCRIPTORS[
      `${assetNamespace}:${assetReference}` as TronSpecialAssetCaipType
    ];

  if (!descriptor) {
    return undefined;
  }

  return {
    type: 'native' as const,
    symbol: descriptor.symbol,
    name: descriptor.name,
    decimals: descriptor.decimals,
    image: TRON_RESOURCE_ICON_URL,
  };
}

/**
 * Adds `assetsInfo` entries for every held Tron resource asset that
 * `AssetsController` does not describe.
 *
 * Existing entries always win, so once the Snap starts reporting this metadata
 * the augmentation becomes a no-op. The input is returned unchanged when there
 * is nothing to add, which keeps downstream memoization intact.
 *
 * @param assetsControllerState - AssetsController state slice.
 * @returns Copy of state with metadata for the held Tron resource assets.
 */
export function augmentTronResourceAssets(
  assetsControllerState: AssetsControllerState,
): AssetsControllerState {
  const assetsInfo = assetsControllerState.assetsInfo ?? {};
  const additions: AssetsControllerState['assetsInfo'] = {};

  for (const balancesByAssetId of Object.values(
    assetsControllerState.assetsBalance ?? {},
  )) {
    for (const assetId of Object.keys(balancesByAssetId) as CaipAssetType[]) {
      if (assetsInfo[assetId] || additions[assetId]) {
        continue;
      }

      const info = getTronResourceAssetInfo(assetId);

      if (info) {
        additions[assetId] = info;
      }
    }
  }

  if (Object.keys(additions).length === 0) {
    return assetsControllerState;
  }

  return {
    ...assetsControllerState,
    assetsInfo: { ...assetsInfo, ...additions },
  };
}
