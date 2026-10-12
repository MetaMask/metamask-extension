import type { MmPayRpcTypeRegistry } from '../types';

/**
 * Type-checks a type registry against its own `payParams`, then widens it for
 * the registry. Safe because each entry only consumes the `payParams` its own
 * `validatePayParams` returns.
 *
 * @param typeRegistry - The type registry.
 * @returns The same type registry, widened.
 */
export function defineMmPayRpcType<PayParams>(
  typeRegistry: MmPayRpcTypeRegistry<PayParams>,
): MmPayRpcTypeRegistry {
  return typeRegistry as MmPayRpcTypeRegistry;
}
