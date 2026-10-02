import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';

import {
  hasMonadReserveBalanceRule,
  simulationIndicatesMonadReserveBalanceViolation,
} from '../../../../../../shared/lib/monad-reserve-balance';
import { useConfirmContext } from '../../../context/confirm';

export function useIsMonadReserveViolation(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
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
