import type { PayRpcType } from '../../../../../shared/lib/transaction/pay-rpc';
import type { MmPayRpcTypeDefinition } from '../types';

export const MMPAY_RPC_TYPES: Partial<
  Record<PayRpcType, MmPayRpcTypeDefinition>
> = {};

export function getMmPayRpcTypeDefinition(
  type: string,
): MmPayRpcTypeDefinition | undefined {
  return Object.hasOwn(MMPAY_RPC_TYPES, type)
    ? MMPAY_RPC_TYPES[type as PayRpcType]
    : undefined;
}
