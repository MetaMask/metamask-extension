import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { useUnapprovedTransactionWithFallback } from './useUnapprovedTransaction';

export function useIsEnforcedSimulationsSupported() {
  const currentConfirmation = useUnapprovedTransactionWithFallback();
  const { delegationAddress, origin, simulationData } = currentConfirmation;

  const isInternalOrigin = !origin || origin === ORIGIN_METAMASK;
  const isUpgraded = Boolean(delegationAddress);

  const hasBalanceChanges =
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length);

  return (
    process.env.ENABLE_ENFORCED_SIMULATIONS &&
    !isInternalOrigin &&
    isUpgraded &&
    hasBalanceChanges
  );
}
