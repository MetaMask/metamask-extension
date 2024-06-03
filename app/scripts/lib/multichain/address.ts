import { is } from 'superstruct';
import { EthAddressStruct } from '@metamask/keyring-api';
import { normalize as normalizeEthAddress } from '@metamask/eth-sig-util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

export function isEthAddress(address: string): boolean {
  return is(address, EthAddressStruct);
}

export function normalizeAddress(address: string): string {
  // NOTE: We assume that the overhead over checking the address format
  // at runtime is small
  return isEthAddress(address)
    ? (normalizeEthAddress(address) as string)
    : address;
}

export function normalizeSafeAddress(address: string): string {
  // NOTE: We assume that the overhead over checking the address format
  // at runtime is small
  return isEthAddress(address) ? toChecksumHexAddress(address) : address;
}
