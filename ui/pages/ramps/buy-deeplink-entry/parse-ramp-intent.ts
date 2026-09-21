import type { CaipAssetType } from '@metamask/utils';
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
  /** Fiat amount requested by the link, e.g. `'100'`. Not yet consumed by the extension buy flow. */
  amount?: string;
  /** Fiat currency code requested by the link, e.g. `'usd'`. */
  currency?: string;
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
  const intentCandidate: Partial<
    RampDeepLinkIntent & { address?: string; chainId?: string }
  > = {
    address: pathParams.address,
    chainId: pathParams.chainId,
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
    !intentCandidate.chainId &&
    !intentCandidate.amount &&
    !intentCandidate.currency
  ) {
    return undefined;
  }

  if (intentCandidate.assetId) {
    // Because assetId is present it takes precedence and we delete address and chainId
    delete intentCandidate.address;
    delete intentCandidate.chainId;
  } else {
    // Because assetId is not present, we assume these are EVM params
    if (!intentCandidate.chainId) {
      intentCandidate.chainId = '1';
    }

    const { address } = intentCandidate;
    let assetIdAssetReference = '';
    if (address && address !== NATIVE_ADDRESS) {
      if (isValidHexAddress(address)) {
        assetIdAssetReference = `erc20:${toChecksumHexAddress(address)}`;
      }
    } else {
      // TODO: replace slip44 with the actual slip44 value for the chain
      assetIdAssetReference = 'slip44:.';
    }

    if (assetIdAssetReference) {
      try {
        const assetIdNamespace = toEvmCaipChainId(
          toHex(intentCandidate.chainId),
        );
        intentCandidate.assetId =
          `${assetIdNamespace}/${assetIdAssetReference}` as CaipAssetType;
      } catch {
        // Invalid chainId — drop the asset intent entirely.
      }
    }

    delete intentCandidate.address;
    delete intentCandidate.chainId;
  }

  Object.keys(intentCandidate).forEach(
    (key) =>
      intentCandidate[key as keyof RampDeepLinkIntent] === undefined &&
      delete intentCandidate[key as keyof RampDeepLinkIntent],
  );

  return intentCandidate as RampDeepLinkIntent;
}
