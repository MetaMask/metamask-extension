import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { isCorrectDeveloperTransactionType } from '../../../../../shared/lib/confirmation.utils';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { useConfirmContext } from '../../context/confirm';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../../../shared/modules/environment';

export const useEnableShieldCoverageChecks = () => {
  const { currentConfirmation } = useConfirmContext();
  const {
    subscriptions,
    loading: subscriptionsLoading,
    error: subscriptionsError,
  } = useUserSubscriptions();

  const hasUserSubscribedToShield =
    !subscriptionsLoading &&
    !subscriptionsError &&
    subscriptions.some((subscription) =>
      subscription.products.some(
        (product) => product.name === PRODUCT_TYPES.SHIELD,
      ),
    );

  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );

  return (
    (isTransactionConfirmation && hasUserSubscribedToShield) ||
    // to show the coverage check for development purposes
    getIsMetaMaskShieldFeatureEnabled()
  );
};
