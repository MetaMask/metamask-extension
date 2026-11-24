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
  checkMoneyAccountPlusBalance,
  startMoneyAccountPlusSubscription,
} from '../../store/controller-actions/subscription-delegation-service';

/** Separates the read-only funding check from the consented subscription start. */
export function useStartMoneyAccountPlusSubscription() {
  const payerAddress = useSelector(selectPrimaryMoneyAccount)?.address;
  const chainId = useSelector(selectMoneyAccountVaultConfig)?.chainId;
  const canUseTestClock = isDevOrUatBuild() || isDevOrTestEnvironment();
  const submissionInFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>();

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
        await startMoneyAccountPlusSubscription({
          ...getPayment(recurringInterval),
          ...(useTestClock && canUseTestClock ? { useTestClock: true } : {}),
        });
        return 'success';
      } catch (startError) {
        if (
          startError instanceof Error &&
          startError.message ===
            SubscriptionControllerErrorMessage.UserAlreadySubscribed
        ) {
          return 'alreadySubscribed';
        }
        setError(startError);
        throw startError;
      } finally {
        submissionInFlight.current = false;
        setIsSubmitting(false);
      }
    },
    [canUseTestClock, getPayment],
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
