import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import { ProductType, Subscription } from '@metamask/subscription-controller';
import { getUserSubscriptions } from '../../selectors/subscription';
import {
  cancelSubscription,
  getSubscriptionBillingPortalUrl,
  getSubscriptions,
  unCancelSubscription,
} from '../../store/actions';
import { useAsyncCallback, useAsyncResult } from '../useAsync';
import { MetaMaskReduxDispatch } from '../../store/store';

export const useUserSubscriptions = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const subscriptions = useSelector(getUserSubscriptions);

  const result = useAsyncResult(async () => {
    return await dispatch(getSubscriptions());
  }, [dispatch]);

  return {
    subscriptions,
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

export const useGetSubscriptionBillingPortalUrl = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  return useAsyncCallback(async () => {
    return await dispatch(getSubscriptionBillingPortalUrl());
  }, [dispatch]);
};
