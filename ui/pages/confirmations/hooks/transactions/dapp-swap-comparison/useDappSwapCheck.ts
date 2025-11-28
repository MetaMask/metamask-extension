import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useConfirmContext } from '../../../context/confirm';

export function useDappSwapCheck() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    dappSwapMetrics: { enabled: dappSwapMetricsEnabled, origins = [] } = {},
  } = useSelector(getRemoteFeatureFlags) as {
    dappSwapMetrics: { enabled: boolean; origins: string[] };
  };
  const { origin, type } = currentConfirmation ?? {
    txParams: { data: '' },
  };

  const isSwapToBeCompared = useMemo(() => {
    return (
      dappSwapMetricsEnabled &&
      origin &&
      origins.includes(origin) &&
      (type === TransactionType.contractInteraction ||
        type === TransactionType.batch)
    );
  }, [origin, type]);

  return {
    isSwapToBeCompared,
  };
}
