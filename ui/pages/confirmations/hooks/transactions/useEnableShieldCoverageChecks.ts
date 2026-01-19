import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
} from '../../../../../shared/lib/shield';
import { getUseExternalServices } from '../../../../selectors';
import { useConfirmContext } from '../../context/confirm';
import { isSignatureTransactionType } from '../../utils';
import { isCorrectDeveloperTransactionType } from '../../../../../shared/lib/confirmation.utils';

export const useEnableShieldCoverageChecks = () => {
  const { subscriptions } = useUserSubscriptions();
  // shield coverage use security alerts, phish detect and transaction simulations, which is only available when basic functionality is enabled
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );
  const isShieldApprovalTx =
    currentConfirmation?.type === TransactionType.shieldSubscriptionApprove;

  const isShieldSubscriptionActive = useMemo(() => {
    return getIsShieldSubscriptionActive(subscriptions);
  }, [subscriptions]);

  const isShieldSubscriptionPaused = useMemo(() => {
    return getIsShieldSubscriptionPaused(subscriptions);
  }, [subscriptions]);

  const isEnabled = isBasicFunctionalityEnabled && isShieldSubscriptionActive;

  const isShowCoverageIndicator =
    (isEnabled || isShieldSubscriptionPaused) &&
    (isSignature || isTransactionConfirmation) &&
    !isShieldApprovalTx; // TODO: we don't show the shield footer coverage indicator for shield approval transactions atm, remove this once ruleengine update to cover shield subscription transaction

  return {
    isEnabled,
    isPaused: isShieldSubscriptionPaused,
    isShowCoverageIndicator,
  };
};
