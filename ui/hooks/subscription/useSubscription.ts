import { useDispatch, useSelector } from "react-redux";
import { getUserSubscriptions } from "../../selectors/subscription";
import { useEffect, useMemo, useState } from "react";
import { getSubscriptions } from "../../store/actions";
import log from "loglevel";
import { ProductType, Subscription } from "@metamask/subscription-controller";

export const useUserSubscriptions = () => {
  const dispatch = useDispatch();
  const subscriptions = useSelector(getUserSubscriptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await dispatch(getSubscriptions());
      } catch (err) {
        log.error('[useUserSubscriptions] error', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  return { subscriptions, loading, error };
};

export const useUserSubscriptionByProduct = (product: ProductType, subscriptions: Subscription[]): Subscription | undefined => {
  return useMemo(() => subscriptions.find((subscription) => subscription.products.some((p) => p.name === product)), [subscriptions, product]);
};
