import type { Json } from '@metamask/utils';

import {
  UniversalTransactionData,
  useUniversalTransactionDataOptional,
} from './useUniversalTransactionData';

export type SolanaTransactionCustomData = Record<string, Json> & {
  count?: number;
};

export type SolanaTransactionData = UniversalTransactionData & {
  custom?: SolanaTransactionCustomData;
};

export function useSolanaTransactionData():
  | SolanaTransactionData
  | undefined {
  const data = useUniversalTransactionDataOptional();

  if (!data?.chainId.startsWith('solana:')) {
    return undefined;
  }

  return data as SolanaTransactionData;
}
