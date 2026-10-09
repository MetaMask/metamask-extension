import type { TransactionMeta } from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
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

// In-wallet flows add these types with `isInternal: true` and the MetaMask
// origin, and a dApp can only choose a transaction type through wallet_mmPay.
export function isMmPayRpcTransaction(transactionMeta: TransactionMeta) {
  return (
    !transactionMeta.isInternal &&
    transactionMeta.origin !== ORIGIN_METAMASK &&
    transactionMeta.type !== undefined &&
    getMmPayRpcTypeDefinition(transactionMeta.type) !== undefined
  );
}
