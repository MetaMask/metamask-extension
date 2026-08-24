import type { Hex } from '@metamask/utils';

/**
 * Chain IDs for which PhishingController.scanAddress will call the
 * Security Alerts API rather than immediately returning ErrorResult.
 *
 * This is the intersection of `DEFAULT_CHAIN_ID_TO_NAME` and
 * `ADDRESS_SCAN_SUPPORTED_CHAINS` in `@metamask/phishing-controller`. Those
 * values are not re-exported from the package root; keep this list in lockstep
 * with `packages/phishing-controller/src/types.ts` in core.
 *
 * @see https://github.com/MetaMask/core/blob/main/packages/phishing-controller/src/PhishingController.ts
 */
const ADDRESS_SCAN_SUPPORTED_CHAIN_IDS = new Set<string>([
  '0x1',
  '0x1079',
  '0x10e6',
  '0x1237',
  '0x12c',
  '0x1388',
  '0x138c5',
  '0x138de',
  '0x13b2',
  '0x13e31',
  '0x144',
  '0x14a34',
  '0x18232',
  '0x1e0',
  '0x2019',
  '0x2105',
  '0x2611',
  '0x279f',
  '0x27bc86aa',
  '0x2b74',
  '0x2eb',
  '0x38',
  '0x3e7',
  '0x531',
  '0x64',
  '0x74c',
  '0x76adf1',
  '0x79a',
  '0x7e4',
  '0x8173',
  '0x82',
  '0x82750',
  '0x89',
  '0x8f',
  '0x93e',
  '0xa',
  '0xa4b1',
  '0xa5bf',
  '0xa869',
  '0xa86a',
  '0xaa36a7',
  '0xab5',
  '0xb67d2',
  '0xba5ed',
  '0xc4',
  '0xdef1',
  '0xe708',
]);

/**
 * Whether Blockaid address screening supports this chain.
 *
 * Matches the gate inside `PhishingController.scanAddress`: the chain ID
 * must resolve to a slug and that slug must be in
 * `ADDRESS_SCAN_SUPPORTED_CHAINS`.
 *
 * @param chainId - Hex chain ID, if known.
 * @returns True when an address scan would hit the Security Alerts API.
 */
export function isAddressScanSupportedChainId(
  chainId: Hex | undefined,
): boolean {
  if (!chainId) {
    return false;
  }

  return ADDRESS_SCAN_SUPPORTED_CHAIN_IDS.has(chainId.toLowerCase());
}
