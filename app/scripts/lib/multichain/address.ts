import { Hex, isValidHexAddress } from '@metamask/utils';
import { normalize as normalizeEthAddress } from '@metamask/eth-sig-util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

/**
 * Checks if an address is an ethereum one.
 *
 * @param address - An address.
 * @returns True if the address is an ethereum one, false otherwise.
 */
export function isEthAddress(address: string): boolean {
  return isValidHexAddress(address as Hex);
}

/**
 * Normalize an address. The address might be returned as-is, if there's no normalizer available.
 *
 * @param address - An address to normalize.
 * @returns The normalized address.
 */
export function normalizeAddress(address: string): string {
  // NOTE: We assume that the overhead over checking the address format
  // at runtime is small
  return isEthAddress(address)
    ? (normalizeEthAddress(address) as string)
    : address;
}

/**
 * Normalize an address to a "safer" representation. The address might be returned as-is, if
 * there's no normalizer available.
 *
 * @param address - An address to normalize.
 * @returns The "safer" normalized address.
 */
export function normalizeSafeAddress(address: string): string {
  // NOTE: We assume that the overhead over checking the address format
  // at runtime is small
  return isEthAddress(address) ? toChecksumHexAddress(address) : address;
}
