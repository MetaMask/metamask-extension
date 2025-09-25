import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import {
  PAYMENT_TYPES,
  ProductType,
  RecurringInterval,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { getUserSubscriptions } from '../../selectors/subscription';
import {
  cancelSubscription,
  getSubscriptionBillingPortalUrl,
  getSubscriptions,
  unCancelSubscription,
  updateSubscriptionCardPaymentMethod,
} from '../../store/actions';
import { useAsyncCallback, useAsyncResult } from '../useAsync';
import { MetaMaskReduxDispatch } from '../../store/store';

export const useUserSubscriptions = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { customerId, subscriptions, trialedProducts } =
    useSelector(getUserSubscriptions);

  const result = useAsyncResult(async () => {
    return await dispatch(getSubscriptions());
  }, [dispatch]);

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
