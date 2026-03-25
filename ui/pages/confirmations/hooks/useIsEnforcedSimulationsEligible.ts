import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import {
  EnforcedSimulationsState,
  getIsEnforcedSimulationsEligible,
  isAddressTrusted,
} from '../../../../shared/lib/transaction/enforced-simulations';
import {
  createCacheKey,
  mapChainIdToSupportedEVMChain,
} from '../../../../shared/lib/trust-signals';
import { useConfirmContext } from '../context/confirm';

export function useIsEnforcedSimulationsEligible(): {
  isEligible: boolean;
  isDefaultEnabled: boolean;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const addressSecurityAlertResponses = useSelector(
    (state: {
      metamask: Pick<EnforcedSimulationsState, 'addressSecurityAlertResponses'>;
    }) => state.metamask.addressSecurityAlertResponses ?? {},
  );

  if (!currentConfirmation) {
    return { isEligible: false, isDefaultEnabled: false };
  }

  const isEligible = getIsEnforcedSimulationsEligible(currentConfirmation);

  if (!isEligible) {
    return { isEligible: false, isDefaultEnabled: false };
  }

  const { chainId, txParams } = currentConfirmation;
  const toAddress = txParams?.to;

  if (!toAddress || !chainId) {
    return { isEligible: true, isDefaultEnabled: false };
  }

  const supportedChain = mapChainIdToSupportedEVMChain(chainId);

  if (!supportedChain) {
    return { isEligible: true, isDefaultEnabled: true };
  }

  const cacheKey = createCacheKey(supportedChain, toAddress);
  const isLoaded = cacheKey in addressSecurityAlertResponses;

  if (!isLoaded) {
    return { isEligible: true, isDefaultEnabled: false };
  }

  const isTrusted = isAddressTrusted(toAddress, chainId, {
    addressSecurityAlertResponses,
  });

  return { isEligible: true, isDefaultEnabled: !isTrusted };
}
