import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';

export function useIsEnforcedSimulationsSupported() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { delegationAddress, origin, simulationData } = currentConfirmation;

  const isInternalOrigin = !origin || origin === ORIGIN_METAMASK;
  const isUpgraded = Boolean(delegationAddress);

  const hasBalanceChanges =
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length);

  return !isInternalOrigin && isUpgraded && hasBalanceChanges;
}
