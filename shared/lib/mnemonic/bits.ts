/* eslint-disable no-bitwise */

/**
 * Bit-packing utilities for compact trie storage.
 */

/**
 * Unpacks a Uint32 into terminalIndex.
 *
 * @param value - packed value
 * @returns 16-bit terminalIndex
 */
export function unpackTerminalIndex(value: number): number {
  return value & 0xffff;
}

/**
 * Packs a 6-bit letterFromParent and 26-bit childMask into a Uint32.
 *
 * @param letterFromParent - 0 if root, else (charCode + 1)
 * @param childMask - 1 bit per child presence
 * @returns 32-bit packed value
 */
export function packLetterAndMask(
  letterFromParent: number,
  childMask: number,
): number {
  return (letterFromParent << 26) | (childMask & 0x03ffffff);
}

/**
 * Unpacks a Uint32 into childMask.
 *
 * @param value - packed value
 * @returns 26-bit childMask
 */
export function unpackChildMask(value: number): number {
  return value & 0x03ffffff;
}

/**
 * Unpacks a Uint32 into childBase.
 *
 * @param value - packed value
 * @returns 16-bit childBase
 */
export function unpackChildBase(value: number): number {
  return value >>> 16;
}
