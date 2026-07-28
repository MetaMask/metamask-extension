import { useCachedEvmTransaction } from './useCachedEvmTransaction';
import { useTransactionQuery } from './useTransactionQuery';

export function useApiTransaction({
  chainId,
  txHash,
}: {
  chainId: string | undefined;
  txHash: string | undefined;
}) {
  const cached = useCachedEvmTransaction({ chainId, txHash });
  const { data: fetched } = useTransactionQuery({
    chainId,
    txHash,
    enabled: Boolean(chainId && txHash && !cached),
  });
  // `fetched` is typed as always-present because of the react-query v4/v5
  // mismatch inside useTransactionQuery, but it is undefined while the query is
  // in flight and whenever the query is disabled for lack of a hash.
  return cached ?? (fetched as typeof fetched | undefined);
}
