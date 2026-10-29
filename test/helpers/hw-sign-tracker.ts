import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

/** Default sender address used across hw-sign-tracker unit tests. */
export const TARGET_FROM = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';

/** Overrides accepted by {@link createTxMeta}. */
export type TxMetaOverrides = Partial<{
  status: TransactionStatus;
  type: TransactionType;
  from: string;
  batchId: string;
  id: string;
}>;

/**
 * Builds a mock `TransactionMeta` for hw-sign-tracker unit tests. Field
 * defaults match the bridge/swap approval shape used by the tracker.
 * @param overrides
 */
export function createTxMeta(overrides: TxMetaOverrides = {}): TransactionMeta {
  return {
    id: overrides.id ?? 'tx-1',
    status: overrides.status ?? TransactionStatus.signed,
    type: overrides.type ?? TransactionType.bridgeApproval,
    txParams: {
      from: overrides.from ?? TARGET_FROM,
    },
    batchId: overrides.batchId as `0x${string}` | undefined,
    chainId: '0x1',
    networkClientId: 'test',
    time: 0,
  };
}

/**
 * Builds a retry-generation ref for hw-sign-tracker unit tests. Typed as a
 * plain object so the helper does not depend on the React type namespace.
 * @param value
 */
export function createRetryGenRef(value: number | undefined = 0): {
  current: number | undefined;
} {
  return { current: value };
}
