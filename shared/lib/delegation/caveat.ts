import { encode } from '@metamask/abi-utils';
import { keccak, toBuffer } from 'ethereumjs-util';
import type { Hex } from '@metamask/utils';
import {
  Caveat as CoreCaveatStruct,
  CAVEAT_TYPEHASH,
} from '@metamask/delegation-core';

/**
 * Represents a CaveatStruct as defined in the Delegation Framework.
 * This uses Hex strings for all byte fields for consistency within MetaMask Extension.
 *
 * This type is based on CaveatStruct from @metamask/delegation-core but
 * constrains all byte fields to Hex strings.
 */
export type Caveat = CoreCaveatStruct<Hex>;

/**
 * Calculates the hash of a single Caveat.
 *
 * @param input - The Caveat data.
 * @returns The keccak256 hash of the encoded Caveat packet.
 */
const getCaveatPacketHash = (input: Caveat): Uint8Array => {
  const encoded = encode(
    ['bytes32', 'address', 'bytes32'],
    [CAVEAT_TYPEHASH, input.enforcer, keccak(toBuffer(input.terms))],
  );
  return keccak(Buffer.from(encoded));
};

/**
 * Calculates the hash of an array of Caveats.
 *
 * @param input - The array of Caveats.
 * @returns The keccak256 hash of the encoded Caveat array packet.
 */
export const getCaveatArrayPacketHash = (input: Caveat[]): Uint8Array => {
  let encoded: Buffer = Buffer.from([]);

  for (const caveat of input) {
    const caveatPacketHash = getCaveatPacketHash(caveat);
    encoded = Buffer.from(
      encode(['bytes', 'bytes32'], [encoded, caveatPacketHash], true),
    );
  }
  return keccak(encoded);
};

/**
 * Creates a caveat.
 *
 * @param enforcer - The contract that guarantees the caveat is upheld.
 * @param terms - The data that the enforcer will use to verify the caveat (unique per enforcer).
 * @param args
 * @returns A Caveat.
 */
export const createCaveat = (
  enforcer: Hex,
  terms: Hex,
  args: Hex = '0x',
): Caveat => ({
  enforcer,
  terms,
  args,
});
