import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  SubscriptionCryptoPaymentMethod,
  CRYPTO_PAYMENT_METHOD_ERRORS,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../useTokenBalances';
import {
  getSubscriptionCryptoApprovalAmount,
  getSubscriptions,
  updateSubscriptionCryptoPaymentMethod,
} from '../../store/actions';
import { getSelectedAccount } from '../../selectors';
import { getTokenBalancesEvm } from '../../selectors/assets';
import { MetaMaskReduxDispatch } from '../../store/store';
import { getIsShieldSubscriptionPaused } from '../../../shared/lib/shield';
import { useAsyncCallback, useAsyncResult } from '../useAsync';
import { MINUTE } from '../../../shared/constants/time';
import { useThrottle } from '../useThrottle';
import {
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

  const paymentChainIds = useMemo(
    () => (cryptoPaymentInfo ? [cryptoPaymentInfo.crypto?.chainId] : []),
    [cryptoPaymentInfo],
  );

  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount?.address),
  );

  // need to do async here since `getSubscriptionCryptoApprovalAmount` make call to background script
  const {
    value: subscriptionCryptoApprovalAmount,
    pending: subscriptionCryptoApprovalAmountPending,
  } = useAsyncResult(async () => {
    if (!shieldSubscription || !cryptoPaymentInfo || !selectedTokenPrice) {
      return undefined;
    }

    const params = {
      chainId: cryptoPaymentInfo.crypto?.chainId,
      paymentTokenAddress: selectedTokenPrice.address,
      productType: PRODUCT_TYPES.SHIELD,
      interval: shieldSubscription.interval,
    };

    return await getSubscriptionCryptoApprovalAmount(params);
  }, [cryptoPaymentInfo, selectedTokenPrice, shieldSubscription]);

  // Poll and update evm balances for payment chains
  pollAndUpdateEvmBalances({ chainIds: paymentChainIds });
  // valid token balances for checking
  const validTokenBalance = useMemo(() => {
    if (
      !cryptoPaymentInfo ||
      !selectedTokenPrice ||
      subscriptionCryptoApprovalAmountPending ||
      !subscriptionCryptoApprovalAmount
    ) {
      return undefined;
    }

    const token = evmBalances.find(
      (t) =>
        cryptoPaymentInfo.crypto?.chainId === t.chainId &&
        selectedTokenPrice.address.toLowerCase() === t.address.toLowerCase(),
    );
    if (!token || !token.balance) {
      return undefined;
    }

    // NOTE: we are using stable coin for subscription atm, so we need to scale the balance by the decimals
    const scaledFactor = 10n ** 6n;
    const scaledBalance =
      BigInt(Math.round(Number(token.balance) * Number(scaledFactor))) /
      scaledFactor;
    const tokenHasEnoughBalance =
      subscriptionCryptoApprovalAmount &&
      scaledBalance * BigInt(10 ** token.decimals) >=
        BigInt(subscriptionCryptoApprovalAmount.approveAmount);

    if (!tokenHasEnoughBalance) {
      return undefined;
    }

    return token;
  }, [
    subscriptionCryptoApprovalAmount,
    subscriptionCryptoApprovalAmountPending,
    evmBalances,
    cryptoPaymentInfo,
    selectedTokenPrice,
  ]);

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

const SHIELD_ADD_FUND_TRIGGER_INTERVAL = 5 * MINUTE;

/**
 * Main hook that combines balance check and handler to automatically trigger
 * subscription check when user adds funds to the selected token
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
    cryptoPaymentInfo?.crypto.error ===
    CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE;

  const { hasAvailableSelectedToken } =
    useShieldSubscriptionCryptoSufficientBalanceCheck();
  const throttledHasAvailableSelectedToken = useThrottle(
    hasAvailableSelectedToken,
    SHIELD_ADD_FUND_TRIGGER_INTERVAL,
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
