import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';

export const useEnableShieldCoverageChecks = () => {
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

  return (
    hasUserSubscribedToShield ||
    // TODO: Delete this condition before releasing to prod. When we release the
    // feature to users, this environment variable will be set to 'true' on
    // `builds.yml`. We should remove this condition before that happens, so
    // that coverage is only shown to users that have subscribed to shield.
    String(process.env.METAMASK_SHIELD_ENABLED) === 'true'
  );
};
