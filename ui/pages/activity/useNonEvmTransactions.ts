import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectNonEvmActivityItems } from '../../selectors/activity';

export function useNonEvmTransactions({ networks }: { networks: string[] }) {
  const nonEvmItems = useSelector(selectNonEvmActivityItems);

  return useMemo(() => {
    if (networks.length === 0) {
      return [];
    }

    const selectedNetworks = new Set(networks);
    return nonEvmItems.filter((item) => selectedNetworks.has(item.chainId));
  }, [networks, nonEvmItems]);
}
