/* eslint-disable no-bitwise */

/**
 * Bit-packing utilities for compact trie storage.
 */

/**
 * Packs a 16-bit terminalIndex and 16-bit parentId into a Uint32.
 *
 * @param terminalIndex - 0xffff if not terminal, else (wordIndex)
 * @param parentId - 0 if root, else node ID of parent
 * @returns 32-bit packed value
 */
export function packTermAndParent(
  terminalIndex: number,
  parentId: number,
): number {
  return (parentId << 16) | terminalIndex;
}

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
 * Unpacks a Uint32 into parentId.
 *
 * @param value - packed value
 * @returns 16-bit parentId
 */
export function unpackParentId(value: number): number {
  return value >>> 16;
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
 * Unpacks a Uint32 into letterFromParent.
 *
 * @param value - packed value
 * @returns 6-bit letterFromParent
 */
export function unpackLetterFromParent(value: number): number {
  return value >>> 26;
}
