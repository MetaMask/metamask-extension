import type { Balance, CaipAssetId } from '@metamask/keyring-api';
import type { CaipChainId, Json } from '@metamask/utils';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../constants/multichain/assets';

/**
 * The CAIP asset type of Tron's native asset (TRX), used to locate the TRX
 * balance entry whose metadata carries energy and bandwidth data.
 */
const TRON_NATIVE_ASSET_TYPE = 'slip44:195';

/**
 * A Tron resource quantity. `null` means the value is not available (missing,
 * explicitly null or malformed in the source data) and must never be treated
 * as a real zero.
 */
export type TronResourceValues = {
  current: number | null;
  max: number | null;
};

/**
 * A snapshot of Tron energy and bandwidth data for one account on one Tron
 * chain.
 */
export type TronResourcesSnapshot = {
  energy: TronResourceValues;
  bandwidth: TronResourceValues;
};

/**
 * Parses a raw Tron resource value into a finite number.
 * Returns `null` for null, undefined, empty strings and anything that is not
 * a finite number, so callers can distinguish "unavailable" from a real zero.
 *
 * @param raw - The raw value from balance metadata or a balance amount.
 * @returns The parsed finite number, or null when unavailable.
 */
export function parseTronResourceValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, Json> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}

/**
 * Extracts Tron energy and bandwidth data from the metadata of the TRX
 * native balance entry, using the structure:
 * `metadata.bandwidth.{limit,available}` and `metadata.energy.{limit,available}`.
 *
 * @param metadata - The `metadata` field of the TRX balance entry, if any.
 * @returns A snapshot when an energy or bandwidth metadata section is present,
 * otherwise null (the metadata path is not in use for this balance).
 */
export function getTronResourcesFromMetadata(
  metadata: Record<string, Json> | undefined,
): TronResourcesSnapshot | null {
  if (!metadata) {
    return null;
  }

  const energy = asRecord(metadata.energy);
  const bandwidth = asRecord(metadata.bandwidth);

  if (!energy && !bandwidth) {
    return null;
  }

  return {
    energy: {
      current: parseTronResourceValue(energy?.available),
      max: parseTronResourceValue(energy?.limit),
    },
    bandwidth: {
      current: parseTronResourceValue(bandwidth?.available),
      max: parseTronResourceValue(bandwidth?.limit),
    },
  };
}

/**
 * Extracts Tron energy and bandwidth data from the Tron special assets
 * emitted as individual balance entries (legacy data path).
 *
 * @param balances - The balance entries for one account, keyed by CAIP asset
 * ID.
 * @param chainId - The CAIP chain ID of the Tron network.
 * @returns A snapshot; fields without a corresponding balance entry are null.
 */
export function getTronResourcesFromSpecialAssetBalances(
  balances: Record<CaipAssetId, Balance>,
  chainId: CaipChainId,
): TronResourcesSnapshot {
  const getAmountForCaipType = (caipType: string): number | null => {
    const assetId = `${chainId}/${caipType}` as CaipAssetId;
    return parseTronResourceValue(balances?.[assetId]?.amount);
  };

  return {
    energy: {
      current: getAmountForCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY),
      max: getAmountForCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY),
    },
    bandwidth: {
      current: getAmountForCaipType(TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH),
      max: getAmountForCaipType(
        TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH,
      ),
    },
  };
}

/**
 * Whether any Tron resource special-asset balance entry exists for the given
 * chain, i.e. whether the legacy data path has delivered any data at all.
 *
 * @param balances - The balance entries for one account, keyed by CAIP asset
 * ID.
 * @param chainId - The CAIP chain ID of the Tron network.
 * @returns True when at least one resource special-asset entry exists.
 */
export function hasTronSpecialAssetBalances(
  balances: Record<CaipAssetId, Balance>,
  chainId: CaipChainId,
): boolean {
  return [
    TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY,
    TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_ENERGY,
    TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH,
    TRON_SPECIAL_ASSET_CAIP_TYPES.MAXIMUM_BANDWIDTH,
  ].some((caipType) => {
    const assetId = `${chainId}/${caipType}` as CaipAssetId;
    return Boolean(balances?.[assetId]);
  });
}

/**
 * The CAIP asset ID of the TRX native asset on the given Tron chain.
 *
 * @param chainId - The CAIP chain ID of the Tron network.
 * @returns The TRX native asset ID.
 */
export function getTronNativeAssetId(chainId: CaipChainId): CaipAssetId {
  return `${chainId}/${TRON_NATIVE_ASSET_TYPE}` as CaipAssetId;
}
