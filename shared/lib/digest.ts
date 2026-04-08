import { keccak, toBuffer } from 'ethereumjs-util';
import { add0x, type Hex } from '@metamask/utils';

/**
 * Computes the Calldata Digest per ERC-8213.
 *
 * Calldata Digest = keccak256(uint256(len(calldata)) || calldata)
 *
 * The length prefix is a big-endian uint256 (32 bytes) to prevent
 * ambiguity between calldata of different lengths sharing a prefix.
 *
 * @param calldata - The raw calldata hex string (0x-prefixed).
 * @returns The 0x-prefixed Calldata Digest hex string.
 */
export function computeCalldataDigest(calldata: Hex): Hex {
  const calldataBuffer = toBuffer(calldata);
  const lengthBuffer = Buffer.alloc(32);
  lengthBuffer.writeUInt32BE(calldataBuffer.length, 28);

  const preimage = Buffer.concat([lengthBuffer, calldataBuffer]);
  return add0x(keccak(preimage).toString('hex'));
}

/**
 * Computes the EIP-712 Digest per ERC-8213.
 *
 * EIP-712 Digest = keccak256("\x19\x01" || domainSeparator || messageHash)
 *
 * @param domainSeparatorHex - The domain separator hash as a hex string.
 * @param messageHashHex - The message struct hash as a hex string.
 * @returns The 0x-prefixed EIP-712 Digest hex string.
 */
export function computeEIP712Digest(
  domainSeparatorHex: string,
  messageHashHex: string,
): Hex {
  const prefix = Buffer.from('1901', 'hex');
  const domainSeparator = toBuffer(
    domainSeparatorHex.startsWith('0x')
      ? domainSeparatorHex
      : `0x${domainSeparatorHex}`,
  );
  const messageHash = toBuffer(
    messageHashHex.startsWith('0x')
      ? messageHashHex
      : `0x${messageHashHex}`,
  );

  const preimage = Buffer.concat([prefix, domainSeparator, messageHash]);
  return add0x(keccak(preimage).toString('hex'));
}
