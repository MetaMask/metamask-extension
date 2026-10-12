import type { PayRpcType } from '../../../../../shared/lib/transaction/pay-rpc';
import type { MmPayRpcTypeRegistry } from '../types';

export const MMPAY_RPC_TYPE_REGISTRIES: Partial<
  Record<PayRpcType, MmPayRpcTypeRegistry>
> = {};

/**
 * Returns the registry entry for a type, ignoring inherited object keys.
 *
 * @param type - The requested type.
 * @returns The type registry, or `undefined` if none is registered.
 */
export function getMmPayRpcTypeRegistry(
  type: string,
): MmPayRpcTypeRegistry | undefined {
  return Object.hasOwn(MMPAY_RPC_TYPE_REGISTRIES, type)
    ? MMPAY_RPC_TYPE_REGISTRIES[type as PayRpcType]
    : undefined;
}
