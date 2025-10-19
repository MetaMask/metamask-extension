import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import {
  PAYMENT_TYPES,
  ProductType,
  RecurringInterval,
  Subscription,
  SubscriptionEligibility,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { getUserSubscriptions } from '../../selectors/subscription';
import {
  cancelSubscription,
  getSubscriptionBillingPortalUrl,
  getSubscriptions,
  getSubscriptionsEligibilities,
  unCancelSubscription,
  updateSubscriptionCardPaymentMethod,
} from '../../store/actions';
import { useAsyncCallback, useAsyncResult } from '../useAsync';
import { MetaMaskReduxDispatch } from '../../store/store';
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { getIsShieldSubscriptionActive } from '../../../shared/lib/shield';

export const useUserSubscriptions = (
  { refetch }: { refetch?: boolean } = { refetch: false },
) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const isUnlocked = useSelector(getIsUnlocked);
  const { customerId, subscriptions, trialedProducts } =
    useSelector(getUserSubscriptions);

  const result = useAsyncResult(async () => {
    if (!isSignedIn || !refetch || !isUnlocked) {
      return undefined;
    }
    return await dispatch(getSubscriptions());
  }, [refetch, dispatch, isSignedIn, isUnlocked]);

  return {
    customerId,
    subscriptions,
    trialedProducts,
    loading: result.pending,
    error: result.error,
  };
};

export const useUserSubscriptionByProduct = (
  product: ProductType,
  subscriptions?: Subscription[],
): Subscription | undefined => {
  return useMemo(
    () =>
      subscriptions?.find((subscription) =>
        subscription.products.some((p) => p.name === product),
      ),
    [subscriptions, product],
  );
};

export const useCancelSubscription = ({
  subscriptionId,
}: {
  subscriptionId?: string;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  return useAsyncCallback(async () => {
    if (!subscriptionId) {
      return;
    }
    await dispatch(cancelSubscription({ subscriptionId }));
  }, [dispatch, subscriptionId]);
};

export const useUnCancelSubscription = ({
  subscriptionId,
}: {
  subscriptionId?: string;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  return useAsyncCallback(async () => {
    if (!subscriptionId) {
      return;
    }
    await dispatch(unCancelSubscription({ subscriptionId }));
  }, [dispatch, subscriptionId]);
};

export const useOpenGetSubscriptionBillingPortal = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  return useAsyncCallback(async () => {
    const { url } = await dispatch(getSubscriptionBillingPortalUrl());
    return await platform.openTab({ url });
  }, [dispatch]);
};

export const useUpdateSubscriptionCardPaymentMethod = ({
  subscriptionId,
  recurringInterval,
}: {
  subscriptionId?: string;
  recurringInterval?: RecurringInterval;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  return useAsyncCallback(async () => {
    if (!subscriptionId || !recurringInterval) {
      throw new Error('Subscription ID and recurring interval are required');
    }
    await dispatch(
      updateSubscriptionCardPaymentMethod({
        subscriptionId,
        paymentType: PAYMENT_TYPES.byCard,
        recurringInterval,
      }),
    );
  }, [dispatch, subscriptionId, recurringInterval]);
};

/**
 * Hook to get the eligibility of a subscription for a given product.
 *
 * @param product - The product to get the eligibility for.
 * @returns An object with the getSubscriptionEligibility function.
 */
export const useSubscriptionEligibility = (product: ProductType) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const isUnlocked = useSelector(getIsUnlocked);

  const getSubscriptionEligibility = useCallback(async (): Promise<
    SubscriptionEligibility | undefined
  > => {
    try {
      // if user is not signed in or unlocked, return undefined
      if (!isSignedIn || !isUnlocked) {
        return undefined;
      }

      // get the subscriptions before making the eligibility request
      // here, we cannot `useUserSubscriptions` hook as the hook's initial state has empty subscriptions array and loading state is false
      // that mistakenly makes `user does not have a subscription` and triggers the eligibility request
      const subscriptions = await dispatch(getSubscriptions());
      const isShieldSubscriptionActive =
        getIsShieldSubscriptionActive(subscriptions);

      if (!isShieldSubscriptionActive) {
        // only if shield subscription is not active, get the eligibility
        const eligibilities = await dispatch(getSubscriptionsEligibilities());
        return eligibilities.find(
          (eligibility) => eligibility.product === product,
        );
      }
      return undefined;
    } catch (error) {
      log.error('[useSubscriptionEligibility] error', error);
      return undefined;
    }
  }, [isSignedIn, isUnlocked, dispatch, product]);

  return {
    getSubscriptionEligibility,
  };
};
