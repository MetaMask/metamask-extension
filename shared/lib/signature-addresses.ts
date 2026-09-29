import {
  MAX_SIGNATURE_ADDRESSES_CEILING,
  type ExtractSignatureAddressesOptions,
} from '@metamask/phishing-controller';
import { PRIMARY_TYPES_PERMIT } from '../constants/signatures';

type TypedDataMessage = {
  primaryType?: unknown;
};

/**
 * Build the common extraction options used by both the background scanner and
 * confirmation alerts. Permit spenders are handled separately so they cannot
 * consume a slot in the generic address window.
 *
 * @param typedDataMessage - Parsed EIP-712 payload.
 * @param signerAddress - Address signing the payload, if present.
 * @returns Shared extraction options for signature address fields.
 */
export function getSignatureAddressExtractionOptions(
  typedDataMessage: TypedDataMessage,
  signerAddress?: string,
): ExtractSignatureAddressesOptions {
  const isPermit = PRIMARY_TYPES_PERMIT.some(
    (type) => type === typedDataMessage.primaryType,
  );

  return {
    exclude: signerAddress ? [signerAddress] : [],
    excludeFields: isPermit ? ['spender'] : [],
    maxAddresses: MAX_SIGNATURE_ADDRESSES_CEILING,
  };
}
