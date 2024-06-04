import { is } from 'superstruct';
import { EthAddressStruct } from '@metamask/keyring-api';
import { normalize as normalizeEthAddress } from '@metamask/eth-sig-util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

/**
 * Checks if an address is an ethereum one.
 *
 * @param address - An address.
 * @returns True if the address is an ethereum one, false otherwise.
 */
export function isEthAddress(address: string): boolean {
  return is(address, EthAddressStruct);
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
