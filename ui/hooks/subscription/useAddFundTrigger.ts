import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  SubscriptionCryptoPaymentMethod,
  CRYPTO_PAYMENT_METHOD_ERRORS,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import {
  getSubscriptions,
  updateSubscriptionCryptoPaymentMethod,
} from '../../store/actions';
import { MetaMaskReduxDispatch } from '../../store/store';
import { getIsShieldSubscriptionPaused } from '../../../shared/lib/shield';
import { useAsyncCallback } from '../useAsync';
import { MINUTE } from '../../../shared/constants/time';
import { useThrottle } from '../useThrottle';
import {
  useAvailableTokenBalances,
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from './useSubscriptionPricing';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from './useSubscription';

/**
 * Check if the shield subscription payment token has sufficient balance for the subscription
 *
 */
export const useShieldSubscriptionCryptoSufficientBalanceCheck = () => {
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );

  const { subscriptionPricing } = useSubscriptionPricing();
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );

  const cryptoPaymentInfo = shieldSubscription?.paymentMethod as
    | SubscriptionCryptoPaymentMethod
    | undefined;
  const selectedTokenPrice = cryptoPaymentInfo
    ? cryptoPaymentMethod?.chains
        ?.find(
          (chain) =>
            chain.chainId.toLowerCase() ===
            cryptoPaymentInfo?.crypto?.chainId.toLowerCase(),
        )
        ?.tokens.find(
          (token) =>
            token.symbol.toLowerCase() ===
            cryptoPaymentInfo?.crypto?.tokenSymbol.toLowerCase(),
        )
    : undefined;

  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );

  const selectedProductPrice = useMemo(() => {
    return pricingPlans?.find(
      (plan) => plan.interval === shieldSubscription?.interval,
    );
  }, [pricingPlans, shieldSubscription]);

  const { availableTokenBalances } = useAvailableTokenBalances({
    paymentChains: cryptoPaymentMethod?.chains,
    price: selectedProductPrice,
    productType: PRODUCT_TYPES.SHIELD,
  });
  // valid token balances for checking
  const validTokenBalance = useMemo(() => {
    if (!cryptoPaymentInfo || !selectedTokenPrice) {
      return undefined;
    }

    const token = availableTokenBalances.find(
      (t) =>
        cryptoPaymentInfo.crypto?.chainId === t.chainId &&
        selectedTokenPrice.address.toLowerCase() === t.address?.toLowerCase(),
    );
    if (!token || !token.balance) {
      return undefined;
    }

    return token;
  }, [cryptoPaymentInfo, selectedTokenPrice, availableTokenBalances]);

  const hasAvailableSelectedToken = Boolean(validTokenBalance);

  return {
    hasAvailableSelectedToken,
    validTokenBalance,
  };
};

/**
 * Handler for triggering subscription check when user adds funds to the selected token
 *
 */
export const useHandleShieldAddFundTrigger = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const isSubscriptionPaused =
    shieldSubscription && getIsShieldSubscriptionPaused(shieldSubscription);

  const { subscriptionPricing } = useSubscriptionPricing();
  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );
  const selectedProductPrice = useMemo(() => {
    return pricingPlans?.find(
      (plan) => plan.interval === shieldSubscription?.interval,
    );
  }, [pricingPlans, shieldSubscription]);
  const cryptoPaymentInfo = shieldSubscription?.paymentMethod as
    | SubscriptionCryptoPaymentMethod
    | undefined;

  const [handleTriggerSubscriptionCheck, result] =
    useAsyncCallback(async () => {
      if (
        !shieldSubscription ||
        !selectedProductPrice ||
        !cryptoPaymentInfo ||
        !isSubscriptionPaused
      ) {
        throw new Error('Invalid parameters to handle shield add fund trigger');
      }

      try {
        // selected token is available, so we can trigger the subscription check
        await dispatch(
          updateSubscriptionCryptoPaymentMethod({
            subscriptionId: shieldSubscription.id,
            paymentType: PAYMENT_TYPES.byCrypto,
            recurringInterval: shieldSubscription.interval,
            chainId: cryptoPaymentInfo.crypto.chainId,
            payerAddress: cryptoPaymentInfo.crypto.payerAddress,
            tokenSymbol: cryptoPaymentInfo.crypto.tokenSymbol,
            billingCycles:
              shieldSubscription.billingCycles ??
              selectedProductPrice?.minBillingCycles,
            rawTransaction: undefined, // no raw transaction to trigger server to check for new funded balance
          }),
        );
        // refetch subscription after trigger subscription check for new status
        await dispatch(getSubscriptions());
      } catch (error) {
        log.error(
          '[useShieldAddFundTrigger] error triggering subscription check',
          error,
        );
      }
    }, [
      dispatch,
      shieldSubscription,
      selectedProductPrice,
      cryptoPaymentInfo,
      isSubscriptionPaused,
    ]);

  return {
    handleTriggerSubscriptionCheck,
    result,
  };
};

const SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME = 5 * MINUTE;

/**
 * Main hook that combines balance check and handler to automatically trigger
 * subscription check when user adds funds to the selected token
 * TODO: this hook is not being used currently because of discussion going on for auto add fund trigger logic, keeping here to use in the future (remove TODO when decided)
 *
 */
export const useShieldAddFundTrigger = () => {
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const isSubscriptionPaused =
    shieldSubscription && getIsShieldSubscriptionPaused(shieldSubscription);

  const cryptoPaymentInfo = shieldSubscription?.paymentMethod as
    | SubscriptionCryptoPaymentMethod
    | undefined;
  const hasInsufficientBalanceError =
    cryptoPaymentInfo?.crypto?.error ===
    CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE;

  const { hasAvailableSelectedToken } =
    useShieldSubscriptionCryptoSufficientBalanceCheck();
  const throttledHasAvailableSelectedToken = useThrottle(
    hasAvailableSelectedToken,
    SHIELD_ADD_FUND_TRIGGER_THROTTLE_TIME,
  );

  const { handleTriggerSubscriptionCheck } = useHandleShieldAddFundTrigger();

  useEffect(() => {
    // Only set up interval if:
    // 1. Subscription is paused
    // 2. There's an insufficient balance error
    // 3. Balance is now sufficient
    if (
      isSubscriptionPaused &&
      hasInsufficientBalanceError &&
      throttledHasAvailableSelectedToken
    ) {
      handleTriggerSubscriptionCheck().catch((error) => {
        log.error(
          '[useShieldAddFundTrigger] error triggering subscription check',
          error,
        );
      });
    }
  }, [
    isSubscriptionPaused,
    hasInsufficientBalanceError,
    throttledHasAvailableSelectedToken,
    handleTriggerSubscriptionCheck,
  ]);
};
