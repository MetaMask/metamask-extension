import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectLocalActivityItems } from '../../selectors/activity';

export function useLocalTransactions({ networks }: { networks: string[] }) {
  const localItems = useSelector(selectLocalActivityItems);

  return useMemo(() => {
    if (networks.length === 0) {
      return [];
    }

    const selectedNetworks = new Set(networks);
    return localItems.filter((item) => selectedNetworks.has(item.chainId));
  }, [localItems, networks]);
}
