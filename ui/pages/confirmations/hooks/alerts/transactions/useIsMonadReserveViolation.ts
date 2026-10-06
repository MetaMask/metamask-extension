import { useMemo } from 'react';

import {
  hasMonadReserveBalanceRule,
  simulationIndicatesMonadReserveBalanceViolation,
} from '../../../../../../shared/lib/monad-reserve-balance';
import { useTransactionMetadataRequestOptional } from '../../transactions/useTransactionMetadataRequest';

export function useIsMonadReserveViolation(): boolean {
  const currentConfirmation = useTransactionMetadataRequestOptional();
  const { chainId, simulationData, simulationFails } =
    currentConfirmation ?? {};

  return useMemo(
    () =>
      hasMonadReserveBalanceRule(chainId) &&
      simulationIndicatesMonadReserveBalanceViolation({
        simulationData,
        simulationFails,
      }),
    [chainId, simulationData, simulationFails],
  );
}
