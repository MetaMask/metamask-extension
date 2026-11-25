import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  PRODUCT_TYPES,
  SubscriptionControllerErrorMessage,
  type RecurringInterval,
} from '@metamask/subscription-controller';
import {
  isDevOrTestEnvironment,
  isDevOrUatBuild,
} from '../../../shared/lib/shield/config';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import { selectMoneyAccountVaultConfig } from '../../selectors/money/money-account-feature-flags';
import {
  findMoneyAccountPlusHubSubscription,
  getMoneyAccountPlusHubSubscription,
} from '../../selectors/subscription/subscription';
import {
  forceUpdateMetamaskState,
  getSubscriptions,
} from '../../store/actions';
import {
  checkMoneyAccountPlusBalance,
  startMoneyAccountPlusSubscription,
} from '../../store/controller-actions/subscription-delegation-service';
import { useDispatch } from '../../store/hooks';

/** Separates the read-only funding check from the consented subscription start. */
export function useStartMoneyAccountPlusSubscription() {
  const dispatch = useDispatch();
  const payerAddress = useSelector(selectPrimaryMoneyAccount)?.address;
  const chainId = useSelector(selectMoneyAccountVaultConfig)?.chainId;
  const existingSubscription = useSelector(getMoneyAccountPlusHubSubscription);
  const canUseTestClock = isDevOrUatBuild() || isDevOrTestEnvironment();
  const submissionInFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>();

  const flushSubscriptionState = useCallback(async () => {
    try {
      await forceUpdateMetamaskState(dispatch);
    } catch {
      // Fall back to the debounced background state stream.
    }
  }, [dispatch]);

  const refreshSubscriptions = useCallback(async () => {
    try {
      const subscriptions = await dispatch(getSubscriptions());
      await flushSubscriptionState();
      return subscriptions;
    } catch {
      await flushSubscriptionState();
      return undefined;
    }
  }, [dispatch, flushSubscriptionState]);

  const getPayment = useCallback(
    (recurringInterval: RecurringInterval) => {
      if (!payerAddress || !chainId) {
        throw new Error('Money Account payment is unavailable');
      }
      return {
        product: PRODUCT_TYPES.MONEY_ACCOUNT_PLUS,
        payerAddress,
        chainId,
        recurringInterval,
      };
    },
    [payerAddress, chainId],
  );

  const checkBalance = useCallback(
    async (recurringInterval: RecurringInterval) => {
      const { product, payerAddress: address } = getPayment(recurringInterval);
      return await checkMoneyAccountPlusBalance({
        product,
        payerAddress: address,
        recurringInterval,
      });
    },
    [getPayment],
  );

  const startSubscription = useCallback(
    async (
      recurringInterval: RecurringInterval,
      { useTestClock = false }: { useTestClock?: boolean } = {},
    ): Promise<'success' | 'alreadySubscribed' | undefined> => {
      if (submissionInFlight.current) {
        return undefined;
      }
      submissionInFlight.current = true;
      setIsSubmitting(true);
      setError(undefined);
      try {
        const payment = getPayment(recurringInterval);
        // The background only blocks active/trialing/provisional, so a new
        // awaiting_funds subscription would not stop a second start.
        if (existingSubscription) {
          const subscriptions = await refreshSubscriptions();
          if (
            !Array.isArray(subscriptions) ||
            findMoneyAccountPlusHubSubscription(subscriptions)
          ) {
            return 'alreadySubscribed';
          }
        }
        await startMoneyAccountPlusSubscription({
          ...payment,
          ...(useTestClock && canUseTestClock ? { useTestClock: true } : {}),
        });
        await flushSubscriptionState();
        return 'success';
      } catch (startError) {
        if (
          startError instanceof Error &&
          startError.message ===
            SubscriptionControllerErrorMessage.UserAlreadySubscribed
        ) {
          await refreshSubscriptions();
          return 'alreadySubscribed';
        }
        setError(startError);
        throw startError;
      } finally {
        submissionInFlight.current = false;
        setIsSubmitting(false);
      }
    },
    [
      canUseTestClock,
      existingSubscription,
      flushSubscriptionState,
      getPayment,
      refreshSubscriptions,
    ],
  );

  return {
    checkBalance,
    startSubscription,
    isSubmitting,
    error,
    canUseTestClock,
    payerAddress,
    chainId,
  };
}
