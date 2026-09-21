import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../shared/lib/hexstring-utils';

/**
 * Buy intent derived from deep link params, mirroring mobile's
 * `parseRampIntent`. Only the fields the unified buy flow consumes are kept.
 */
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

type RampIntentCandidate = RampDeepLinkIntent & {
  address?: string;
  /** Raw chainId param from the link, before CAIP-2 conversion. */
  rawChainId?: string;
};

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Builds a buy intent from `/buy` deep link query params (ported from
 * mobile's `app/components/UI/Ramp/utils/parseRampIntent.ts`).
 *
 * Supports both a CAIP-19 `assetId` param and the EVM-style
 * `address` + `chainId` pair used by Portfolio links, which is converted to a
 * CAIP-19 asset id. The native token is expressed as the zero address or a
 * missing address.
 *
 * @param pathParams - The deep link query params.
 * @returns The intent, or undefined when no intent params are present.
 */
export function parseRampIntent(
  pathParams: Record<string, string | undefined>,
): RampDeepLinkIntent | undefined {
  const intentCandidate: Partial<RampIntentCandidate> = {
    address: pathParams.address,
    rawChainId: pathParams.chainId,
    // The link-provided assetId is validated downstream by the buy flow's
    // catalog lookup, which fails closed with an unsupported-asset modal.
    assetId: pathParams.assetId as CaipAssetType | undefined,
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
    // Because assetId is present it takes precedence and we delete address and chainId
    delete intentCandidate.address;
    delete intentCandidate.rawChainId;
  } else {
    // Because assetId is not present, we assume these are EVM params
    let assetIdNamespace: CaipChainId | undefined;
    try {
      assetIdNamespace = toEvmCaipChainId(
        toHex(intentCandidate.rawChainId ?? '1'),
      );
    } catch {
      // Invalid chainId — drop the asset intent entirely.
    }

    if (assetIdNamespace) {
      // Retained on the intent so the Portfolio fallback deeplink keeps the
      // link's chain.
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

  Object.keys(intentCandidate).forEach(
    (key) =>
      intentCandidate[key as keyof RampDeepLinkIntent] === undefined &&
      delete intentCandidate[key as keyof RampDeepLinkIntent],
  );

  if (Object.keys(intentCandidate).length === 0) {
    return undefined;
  }

  return intentCandidate as RampDeepLinkIntent;
}
