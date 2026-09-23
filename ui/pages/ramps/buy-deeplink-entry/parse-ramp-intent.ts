import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { CAIP_ASSET_TYPE_REGEX } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../shared/lib/hexstring-utils';

/** Buy intent derived from deep link params (mobile `parseRampIntent` parity). */
export type RampDeepLinkIntent = {
  /** CAIP-19 asset to pre-select, e.g. `eip155:1/erc20:0x...`. */
  assetId?: CaipAssetType;
  /** CAIP-2 chain of the link, e.g. `eip155:1`, kept for the Portfolio fallback deeplink. */
  chainId?: CaipChainId;
  /** Fiat amount requested by the link, e.g. `'100'`. Not yet consumed by the extension buy flow. */
  amount?: string;
  /** Fiat currency code requested by the link, e.g. `'usd'`. */
  currency?: string;
};

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Validates a link-provided CAIP-19 asset id and rejects malformed ones: deep
 * link params are untrusted input, and the buy flow's catalog lookup fails
 * open while the catalog is unsettled.
 *
 * @param value - The raw `assetId` query param.
 * @returns The validated asset id string, or undefined when malformed.
 */
function validateCaipAssetId(value: string): CaipAssetType | undefined {
  return CAIP_ASSET_TYPE_REGEX.test(value)
    ? (value as CaipAssetType)
    : undefined;
}

/**
 * Builds a buy intent from `/buy` deep link query params (mobile
 * `parseRampIntent` parity). Supports both a CAIP-19 `assetId` param and the
 * EVM-style `address` + `chainId` pair used by Portfolio links, converted to
 * a CAIP-19 asset id; the native token is the zero address or no address.
 *
 * @param pathParams - The deep link query params.
 * @returns The intent, or undefined when no intent params survive.
 */
export function parseRampIntent(
  pathParams: Record<string, string | undefined>,
): RampDeepLinkIntent | undefined {
  const intentCandidate: Partial<
    RampDeepLinkIntent & { address?: string; rawChainId?: string }
  > = {
    address: pathParams.address,
    rawChainId: pathParams.chainId,
    assetId: pathParams.assetId
      ? validateCaipAssetId(pathParams.assetId)
      : undefined,
    amount: pathParams.amount,
    currency: pathParams.currency,
  };

  // return with undefined if the pathParams do not contain the necessary fields
  if (
    !intentCandidate.address &&
    !intentCandidate.assetId &&
    !intentCandidate.rawChainId &&
    !intentCandidate.amount &&
    !intentCandidate.currency
  ) {
    return undefined;
  }

  if (intentCandidate.assetId) {
    // assetId is present: it takes precedence over the EVM params.
    delete intentCandidate.address;
    delete intentCandidate.rawChainId;
  } else {
    // No assetId: assume EVM `address` + `chainId` params.
    let assetIdNamespace: CaipChainId | undefined;
    try {
      assetIdNamespace = toEvmCaipChainId(
        toHex(intentCandidate.rawChainId ?? '1'),
      );
    } catch {
      // Invalid chainId — drop the asset intent entirely.
    }

    if (assetIdNamespace) {
      // Retained so the Portfolio fallback deeplink keeps the link's chain.
      intentCandidate.chainId = assetIdNamespace;

      const { address } = intentCandidate;
      if (!address || address === NATIVE_ADDRESS) {
        // The ramps controller currently represents native assets with slip44:.
        intentCandidate.assetId =
          `${assetIdNamespace}/slip44:.` as CaipAssetType;
      } else if (isValidHexAddress(address)) {
        intentCandidate.assetId =
          `${assetIdNamespace}/erc20:${toChecksumHexAddress(address)}` as CaipAssetType;
      } else {
        // Invalid address — drop the asset intent, keep the chain.
        delete intentCandidate.assetId;
      }
      delete intentCandidate.address;
    } else {
      delete intentCandidate.address;
      delete intentCandidate.assetId;
    }
  }

  delete intentCandidate.rawChainId;

  const intent = Object.fromEntries(
    Object.entries(intentCandidate).filter(([, value]) => value !== undefined),
  ) as Partial<RampDeepLinkIntent>;

  return Object.keys(intent).length > 0
    ? (intent as RampDeepLinkIntent)
    : undefined;
}
