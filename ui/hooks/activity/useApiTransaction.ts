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
  return cached ?? fetched;
}
