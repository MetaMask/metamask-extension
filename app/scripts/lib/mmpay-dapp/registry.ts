import { perpsDepositDefinition } from './builders/perps-deposit';
import { perpsWithdrawDefinition } from './builders/perps-withdraw';
import type { MmPayDefinition, MmPayType } from './types';

/**
 * Registry of all supported MMPay dApp transaction types.
 *
 * To add a new MMPay type:
 * 1. Create a builder in `./builders/<type>.ts` exporting a `MmPayDefinition`.
 * 2. Add it to `MMPAY_REGISTRY` below.
 * 3. Extend `MmPayType` in `./types.ts`.
 * 4. Update the allowed types in `shared/lib/deep-links/routes/mmpay.ts`.
 */
export const MMPAY_REGISTRY: Record<MmPayType, MmPayDefinition> = {
  perpsDeposit: perpsDepositDefinition,
  perpsWithdraw: perpsWithdrawDefinition,
};

/**
 * Type guard for MMPay transaction types.
 *
 * @param x - Value to test.
 * @returns `true` when `x` is a registered `MmPayType`.
 */
export function isMmPayType(x: unknown): x is MmPayType {
  return typeof x === 'string' && x in MMPAY_REGISTRY;
}
