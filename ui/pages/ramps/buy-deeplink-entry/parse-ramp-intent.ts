import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { isCaipAssetType } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../shared/lib/hexstring-utils';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import type { RampIntent } from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';

/**
 * Builds a buy intent from `/buy` deep link params (mobile `parseRampIntent`
 * parity). Accepts a CAIP-19 `assetId` or the EVM `address` + `chainId` pair;
 * `amount` and `currency` are not consumable by the in-app flow.
 *
 * @param params - The deep link query params.
 * @returns The intent, or undefined when no valid asset survives.
 */
export function parseRampIntent(
  params: URLSearchParams,
): RampIntent | undefined {
  const address = params.get('address');
  const rawAssetId = params.get('assetId');
  const chainId = params.get('chainId');

  // Untrusted params: malformed asset ids must never reach the catalog lookup.
  const assetId =
    rawAssetId && isCaipAssetType(rawAssetId) ? rawAssetId : undefined;
  if (assetId) {
    return { assetId };
  }

  if (!address && !chainId) {
    return undefined;
  }

  let evmChainId: CaipChainId;
  try {
    evmChainId = toEvmCaipChainId(toHex(chainId ?? '1'));
  } catch {
    return undefined;
  }

  if (!address || address === NATIVE_TOKEN_ADDRESS) {
    // `slip44:.` is the native placeholder matched by `resolveRampControllerToken`.
    return { assetId: `${evmChainId}/slip44:.` as CaipAssetType };
  }
  if (isValidHexAddress(address)) {
    return {
      assetId:
        `${evmChainId}/erc20:${toChecksumHexAddress(address)}` as CaipAssetType,
    };
  }
  return undefined;
}
