import type { PayRpcType } from '../../../../../shared/lib/transaction/pay-rpc';
import type { WalletPayTypeRegistry } from '../types';

export const WALLET_PAY_TYPE_REGISTRIES: Partial<
  Record<PayRpcType, WalletPayTypeRegistry>
> = {};

/**
 * Returns the registry entry for a type, ignoring inherited object keys.
 *
 * @param type - The requested type.
 * @returns The type registry, or `undefined` if none is registered.
 */
export function getWalletPayTypeRegistry(
  type: string,
): WalletPayTypeRegistry | undefined {
  return Object.hasOwn(WALLET_PAY_TYPE_REGISTRIES, type)
    ? WALLET_PAY_TYPE_REGISTRIES[type as PayRpcType]
    : undefined;
}
