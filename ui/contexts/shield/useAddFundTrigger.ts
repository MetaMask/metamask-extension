import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  SUBSCRIPTION_STATUSES,
  SubscriptionCryptoPaymentMethod,
  SubscriptionStatus,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../hooks/useTokenBalances';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import {
  getSubscriptions,
  updateSubscriptionCryptoPaymentMethod,
} from '../../store/actions';
import { getSelectedAccount } from '../../selectors';
import {
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from '../../hooks/subscription/useSubscriptionPricing';
import { isCryptoPaymentMethod } from '../../pages/settings/transaction-shield-tab/types';
import { getTokenBalancesEvm } from '../../selectors/assets';
import { MetaMaskReduxDispatch } from '../../store/store';
import { calculateSubscriptionRemainingBillingCycles } from '../../../shared/modules/shield';
import { useThrottle } from '../../hooks/useThrottle';
import { MINUTE } from '../../../shared/constants/time';

const SHIELD_ADD_FUND_TRIGGER_INTERVAL = 5 * MINUTE;

/**
 * Trigger the subscription check after user funding met criteria
 *
 */
export const useShieldAddFundTrigger = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { subscriptions } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  // TODO: update to correct subscription status after implementation
  const isSubscriptionPaused =
    shieldSubscription &&
    (
      [
        SUBSCRIPTION_STATUSES.paused,
        SUBSCRIPTION_STATUSES.pastDue,
        SUBSCRIPTION_STATUSES.unpaid,
      ] as SubscriptionStatus[]
    ).includes(shieldSubscription.status);

  const { subscriptionPricing } = useSubscriptionPricing();
  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );
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
            cryptoPaymentInfo?.crypto.chainId.toLowerCase(),
        )
        ?.tokens.find(
          (token) =>
            token.symbol.toLowerCase() ===
            cryptoPaymentInfo?.crypto.tokenSymbol.toLowerCase(),
        )
    : undefined;

  const selectedProductPrice = useMemo(() => {
    return pricingPlans?.find(
      (plan) => plan.interval === shieldSubscription?.interval,
    );
  }, [pricingPlans, shieldSubscription]);

  const paymentChainIds = useMemo(
    () => (cryptoPaymentInfo ? [cryptoPaymentInfo.crypto.chainId] : []),
    [cryptoPaymentInfo],
  );

  const selectedAccount = useSelector(getSelectedAccount);
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount?.address),
  );

  // Poll and update evm balances for payment chains
  pollAndUpdateEvmBalances({ chainIds: paymentChainIds });
  // valid token balances for checking
  const validTokenBalances = useMemo(() => {
    return evmBalances.filter((token) => {
      const supportedTokensForChain =
        cryptoPaymentInfo?.crypto.chainId === token.chainId;
      const isSupportedChain = Boolean(supportedTokensForChain);
      if (!isSupportedChain) {
        return false;
      }
      const isSupportedToken =
        cryptoPaymentInfo?.crypto.tokenSymbol.toLowerCase() ===
        token.symbol.toLowerCase();
      if (!isSupportedToken) {
        return false;
      }
      const hasBalance = token.balance && parseFloat(token.balance) > 0;
      if (!hasBalance) {
        return false;
      }
      if (!selectedProductPrice || !shieldSubscription?.endDate) {
        return false;
      }

      const remainingBillingCycles =
        calculateSubscriptionRemainingBillingCycles({
          currentPeriodEnd: new Date(shieldSubscription.currentPeriodEnd),
          endDate: new Date(shieldSubscription.endDate),
          interval: shieldSubscription.interval,
        });
      // no need to use BigInt since max unitDecimals are always 2 for price
      const remainingFundBalanceNeeded =
        (selectedProductPrice.unitAmount /
          10 ** selectedProductPrice.unitDecimals) *
        remainingBillingCycles;

      return (
        token.balance && parseFloat(token.balance) >= remainingFundBalanceNeeded
      );
    });
  }, [
    evmBalances,
    cryptoPaymentInfo,
    selectedProductPrice,
    shieldSubscription,
  ]);

  const hasAvailableSelectedToken = validTokenBalances.length > 0;

  // throttle the hasAvailableSelectedToken to avoid multiple triggers
  const { value: hasAvailableSelectedTokenThrottled } = useThrottle({
    value: hasAvailableSelectedToken,
    interval: SHIELD_ADD_FUND_TRIGGER_INTERVAL,
  });

  const handleTriggerSubscriptionCheck = useCallback(async () => {
    if (
      !shieldSubscription ||
      !selectedProductPrice ||
      !hasAvailableSelectedTokenThrottled ||
      !cryptoPaymentInfo
    ) {
      return;
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
    hasAvailableSelectedTokenThrottled,
    cryptoPaymentInfo,
  ]);

  useEffect(() => {
    if (
      !shieldSubscription ||
      !isSubscriptionPaused ||
      !subscriptionPricing ||
      !cryptoPaymentInfo ||
      !selectedProductPrice
    ) {
      return;
    }
    const isInsufficientBalanceError =
      cryptoPaymentInfo.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE;

    const isCryptoPayment = isCryptoPaymentMethod(
      shieldSubscription.paymentMethod,
    );
    if (
      !isInsufficientBalanceError ||
      !isCryptoPayment ||
      !selectedTokenPrice ||
      !hasAvailableSelectedTokenThrottled
    ) {
      return;
    }

    handleTriggerSubscriptionCheck();
  }, [
    isSubscriptionPaused,
    subscriptionPricing,
    cryptoPaymentInfo,
    selectedTokenPrice,
    selectedProductPrice,
    hasAvailableSelectedTokenThrottled,
    shieldSubscription,
    handleTriggerSubscriptionCheck,
  ]);
};
