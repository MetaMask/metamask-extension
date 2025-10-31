import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  SubscriptionCryptoPaymentMethod,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { useTokenBalances as pollAndUpdateEvmBalances } from '../../hooks/useTokenBalances';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import {
  getSubscriptionCryptoApprovalAmount,
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
import { useThrottle } from '../../hooks/useThrottle';
import { MINUTE } from '../../../shared/constants/time';
import { getIsShieldSubscriptionPaused } from '../../../shared/lib/shield';
import { useAsyncResult } from '../../hooks/useAsync';

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
  const isSubscriptionPaused = shieldSubscription && getIsShieldSubscriptionPaused(shieldSubscription);

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

  // need to do async here since `getSubscriptionCryptoApprovalAmount` make call to background script
  const { value: subscriptionCryptoApprovalAmount, pending: subscriptionCryptoApprovalAmountPending } = useAsyncResult(async () => {
    if (!shieldSubscription || !cryptoPaymentInfo || !selectedTokenPrice) {
      return undefined;
    }

    const params = {
      chainId: cryptoPaymentInfo.crypto.chainId,
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
    console.log('>>>> hehrersubscriptionCryptoApprovalAmount', {
      cryptoPaymentInfo,
      selectedTokenPrice,
      subscriptionCryptoApprovalAmountPending,
      subscriptionCryptoApprovalAmount,
    });
    if (!cryptoPaymentInfo || !selectedTokenPrice || subscriptionCryptoApprovalAmountPending || !subscriptionCryptoApprovalAmount) {
      return undefined;
    }

    const token = evmBalances.find((token) => cryptoPaymentInfo.crypto.chainId === token.chainId && selectedTokenPrice.address.toLowerCase() === token.address.toLowerCase());
    console.log('>>>> hehrertoken', {
      token,
      evmBalances,
    });
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
    console.log('>>>> hehrertokenHasEnoughBalance', {
      tokenHasEnoughBalance,
      token,
    });

    if (!tokenHasEnoughBalance) {
      return undefined;
    }

    return token;
  }, [
    subscriptionCryptoApprovalAmount,
    subscriptionCryptoApprovalAmountPending,
    evmBalances,
    cryptoPaymentInfo,
    shieldSubscription,
  ]);

  const hasAvailableSelectedToken = !!validTokenBalance;

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
