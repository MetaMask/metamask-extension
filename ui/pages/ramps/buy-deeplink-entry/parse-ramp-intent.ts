import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { isCaipAssetType } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../shared/lib/hexstring-utils';

/**
 * Buy intent derived from `/buy` deep link params (mobile `parseRampIntent`
 * parity): the CAIP-19 asset to pre-select in the buy flow. `amount` and
 * `currency` are not consumable by the extension's in-app buy flow and are
 * intentionally dropped.
 */
export type RampDeepLinkIntent = {
  /** CAIP-19 asset to pre-select, e.g. `eip155:1/erc20:0x...`. */
  assetId: CaipAssetType;
};

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Builds a buy intent from `/buy` deep link query params (mobile
 * `parseRampIntent` parity). Supports both a CAIP-19 `assetId` param and the
 * EVM-style `address` + `chainId` pair used by Portfolio links, converted to
 * a CAIP-19 asset id; the native token is the zero address or no address.
 *
 * @param pathParams - The deep link query params.
 * @returns The intent, or undefined when no valid asset survives.
 */
export function parseRampIntent(
  pathParams: Record<string, string | undefined>,
): RampDeepLinkIntent | undefined {
  const { address, assetId: rawAssetId, chainId } = pathParams;

  // Deep link params are untrusted input, and the buy flow's catalog lookup
  // fails open while the catalog is unsettled, so malformed asset ids must
  // never reach it.
  const assetId =
    rawAssetId && isCaipAssetType(rawAssetId) ? rawAssetId : undefined;
  if (assetId) {
    // A valid CAIP-19 assetId param takes precedence over the EVM params.
    return { assetId };
  }

  if (!address && !chainId) {
    return undefined;
  }

  // No assetId: assume EVM `address` + `chainId` params (Portfolio link shape).
  let evmChainId: CaipChainId;
  try {
    evmChainId = toEvmCaipChainId(toHex(chainId ?? '1'));
  } catch {
    // Invalid chainId — drop the asset intent entirely.
    return undefined;
  }

  if (!address || address === NATIVE_ADDRESS) {
    // The ramps controller currently represents native assets with slip44:.
    return { assetId: `${evmChainId}/slip44:.` as CaipAssetType };
  }
  if (isValidHexAddress(address)) {
    return {
      assetId: `${evmChainId}/erc20:${toChecksumHexAddress(address)}` as CaipAssetType,
    };
  }
  // Invalid address — drop the asset intent.
  return undefined;
}
