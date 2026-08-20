import { TransactionMeta } from '@metamask/transaction-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import {
  EnforcedSimulationsState,
  getInternalEvmAddresses,
  isEnforcedSimulationsEligible,
  isEnforcedSimulationsForceEnabled,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { getEip7702SupportedChains } from '../../../../shared/lib/eip7702-support-utils';
import { useIsHardwareWalletAccount } from '../../../hooks/useIsHardwareWalletAccount';
import { useConfirmContext } from '../context/confirm';
import { selectIsEnforcedSimulationsEnabled } from '../selectors/feature-flags';
import { getInternalAccounts } from '../../../selectors/accounts';
import { EMPTY_OBJECT } from '../../../selectors/shared';

function selectEip7702SupportedChains(state: {
  metamask: RemoteFeatureFlagControllerState;
}): ReturnType<typeof getEip7702SupportedChains> {
  return getEip7702SupportedChains(state.metamask);
}

export function useIsEnforcedSimulationsEligible(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const addressSecurityAlertResponses = useSelector(
    (state: { metamask: EnforcedSimulationsState }) =>
      state.metamask.addressSecurityAlertResponses ??
      (EMPTY_OBJECT as EnforcedSimulationsState['addressSecurityAlertResponses']),
  );

  const eip7702SupportedChains = useSelector(
    selectEip7702SupportedChains,
    isEqual,
  );

  const internalAccounts = useSelector(getInternalAccounts);
  const internalAddresses = useMemo(
    () => getInternalEvmAddresses(internalAccounts),
    [internalAccounts],
  );

  const enabled = useSelector(selectIsEnforcedSimulationsEnabled);

  const isHardwareWallet = useIsHardwareWalletAccount(
    currentConfirmation?.txParams?.from,
  );

  if (
    (!enabled && !isEnforcedSimulationsForceEnabled()) ||
    !currentConfirmation ||
    isHardwareWallet
  ) {
    return false;
  }

  return isEnforcedSimulationsEligible(currentConfirmation, {
    addressSecurityAlertResponses,
    eip7702SupportedChains,
    internalAddresses,
  });
}
