import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { useTransactionMetadataRequest } from '../../useTransactionMetadataRequest';

export function useDappSwapCheck() {
  const currentConfirmation = useTransactionMetadataRequest();
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
      origin !== undefined &&
      origins.includes(origin) &&
      (type === TransactionType.contractInteraction ||
        type === TransactionType.batch)
    );
  }, [dappSwapMetricsEnabled, origin, origins, type]);

  return {
    isSwapToBeCompared,
  };
}
