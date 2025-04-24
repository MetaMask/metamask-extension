import type { Hex } from './viem';
import {
  encodeAbiParameters,
  encodePacked,
  keccak256,
  parseAbiParameters,
  toHex,
} from './viem';

export const CAVEAT_ABI_TYPE_COMPONENTS = [
  { type: 'address', name: 'enforcer' },
  { type: 'bytes', name: 'terms' },
  { type: 'bytes', name: 'args' },
];

export type Caveat = {
  enforcer: Hex;
  terms: Hex;
  args: Hex;
};

export const CAVEAT_TYPEHASH: Hex = keccak256(
  toHex('Caveat(address enforcer,bytes terms)'),
);

/**
 * Calculates the hash of a single Caveat.
 *
 * @param input - The Caveat data.
 * @returns The keccak256 hash of the encoded Caveat packet.
 */
export const getCaveatPacketHash = (input: Caveat): Hex => {
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, bytes32'),
    [CAVEAT_TYPEHASH, input.enforcer, keccak256(input.terms)],
  );
  return keccak256(encoded);
};

/**
 * Calculates the hash of an array of Caveats.
 *
 * @param input - The array of Caveats.
 * @returns The keccak256 hash of the encoded Caveat array packet.
 */
export const getCaveatArrayPacketHash = (input: Caveat[]): Hex => {
  let encoded: Hex = '0x';

  for (const caveat of input) {
    const caveatPacketHash = getCaveatPacketHash(caveat);
    encoded = encodePacked(['bytes', 'bytes32'], [encoded, caveatPacketHash]);
  }
  return keccak256(encoded);
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
