import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import { ProductType, Subscription } from '@metamask/subscription-controller';
import { getSubscriptions } from '../../store/actions';
import { getUserSubscriptions } from '../../selectors/subscription';
import { useAsyncResult } from '../useAsync';
import { MetaMaskReduxDispatch } from '../../store/store';

export const useUserSubscriptions = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const subscriptions = useSelector(getUserSubscriptions);

  const result = useAsyncResult(async () => {
    return await dispatch(getSubscriptions());
  }, [dispatch]);

  return { subscriptions, loading: result.pending, error: result.error };
};

export const useUserSubscriptionByProduct = (
  product: ProductType,
  subscriptions: Subscription[],
): Subscription | undefined => {
  return useMemo(
    () =>
      subscriptions.find((subscription) =>
        subscription.products.some((p) => p.name === product),
      ),
    [subscriptions, product],
  );
};
