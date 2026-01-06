import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  PricingResponse,
  Subscription,
  SubscriptionCryptoPaymentMethod,
  TokenPaymentInfo,
} from '@metamask/subscription-controller';
import { getIsShieldSubscriptionPaused } from '../../../shared/lib/shield';
import { useSubscriptionMetrics } from '../shield/metrics/useSubscriptionMetrics';
import {
  ShieldMetricsSourceEnum,
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../shared/constants/subscriptions';
import { SHIELD_PLAN_ROUTE } from '../../helpers/constants/routes';
import { isCryptoPaymentMethod } from '../../pages/settings/transaction-shield-tab/types';
import { useAsyncResult } from '../useAsync';
import { getSubscriptionCryptoApprovalAmount } from '../../store/actions';
import {
  TokenWithApprovalAmount,
  useSubscriptionPaymentMethods,
} from './useSubscriptionPricing';
import {
  useHandleShieldAddFundTrigger,
  useShieldSubscriptionCryptoSufficientBalanceCheck,
} from './useAddFundTrigger';
import {
  useUpdateSubscriptionCardPaymentMethod,
  useSubscriptionCryptoApprovalTransaction,
  useUpdateSubscriptionCryptoPaymentMethod,
  useHandleSubscriptionSupportAction,
} from './useSubscription';

/**
 * Hook to handle payment errors for subscriptions.
 *
 * @param options - The options for the hook.
 * @param options.currentShieldSubscription - The current shield subscription.
 * @param options.displayedShieldSubscription - The displayed shield subscription.
 * @param options.subscriptions - The list of subscriptions to check paused status.
 * @param options.isCancelled - Whether the subscription is cancelled.
 * @param options.onOpenAddFundsModal - Callback to open the add funds modal.
 * @param options.subscriptionPricing - The subscription pricing data.
 * @returns An object containing the handlePaymentError function, handlePaymentErrorInsufficientFunds function, handlePaymentMethodChange function, payment error flags, and currentToken.
 */
export const useHandlePayment = ({
  currentShieldSubscription,
  displayedShieldSubscription,
  subscriptions,
  isCancelled,
  subscriptionPricing,
  onOpenAddFundsModal,
}: {
  currentShieldSubscription?: Subscription;
  displayedShieldSubscription?: Subscription;
  subscriptions?: Subscription[];
  isCancelled: boolean;
  subscriptionPricing?: PricingResponse;
  onOpenAddFundsModal: () => void;
}) => {
  const navigate = useNavigate();
  const { captureShieldErrorStateClickedEvent } = useSubscriptionMetrics();

  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );

  const currentToken = useMemo((): TokenPaymentInfo | undefined => {
    if (
      !displayedShieldSubscription ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
    ) {
      return undefined;
    }
    const chainPaymentInfo = cryptoPaymentMethod?.chains?.find(
      (chain) =>
        chain.chainId ===
        (
          displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod
        ).crypto.chainId,
    );

    const token = chainPaymentInfo?.tokens.find(
      (chainPaymentToken) =>
        chainPaymentToken.symbol ===
        (
          displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod
        ).crypto.tokenSymbol,
    );

    return token;
  }, [cryptoPaymentMethod, displayedShieldSubscription]);

  // watch handle add fund trigger server check subscription paused because of insufficient funds
  const {
    hasAvailableSelectedToken:
      hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
  } = useShieldSubscriptionCryptoSufficientBalanceCheck();
  const {
    handleTriggerSubscriptionCheck:
      handleTriggerSubscriptionCheckInsufficientFunds,
    result: resultTriggerSubscriptionCheckInsufficientFunds,
  } = useHandleShieldAddFundTrigger();

  const [
    executeUpdateSubscriptionCardPaymentMethod,
    updateSubscriptionCardPaymentMethodResult,
  ] = useUpdateSubscriptionCardPaymentMethod({
    subscription: currentShieldSubscription,
    newRecurringInterval: currentShieldSubscription?.interval,
  });

  const { handleClickContactSupport } = useHandleSubscriptionSupportAction();

  const productInfo = useMemo(
    () =>
      displayedShieldSubscription?.products.find(
        (p) => p.name === PRODUCT_TYPES.SHIELD,
      ),
    [displayedShieldSubscription],
  );

  const { value: subscriptionCryptoApprovalAmount } =
    useAsyncResult(async () => {
      if (
        !currentToken ||
        !displayedShieldSubscription ||
        !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
      ) {
        return undefined;
      }
      const amount = await getSubscriptionCryptoApprovalAmount({
        chainId: displayedShieldSubscription.paymentMethod.crypto.chainId,
        paymentTokenAddress: currentToken.address,
        productType: PRODUCT_TYPES.SHIELD,
        interval: displayedShieldSubscription.interval,
      });

      return amount;
    }, [currentToken, displayedShieldSubscription]);

  const paymentToken = useMemo<
    | Pick<
        TokenWithApprovalAmount,
        'chainId' | 'address' | 'approvalAmount' | 'symbol'
      >
    | undefined
  >(() => {
    if (
      !displayedShieldSubscription ||
      !currentToken ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod) ||
      !displayedShieldSubscription.endDate ||
      !productInfo ||
      !subscriptionCryptoApprovalAmount
    ) {
      return undefined;
    }

    return {
      chainId: displayedShieldSubscription.paymentMethod.crypto.chainId,
      address: currentToken.address,
      symbol: currentToken.symbol,
      approvalAmount: {
        approveAmount: subscriptionCryptoApprovalAmount.approveAmount,
        chainId: displayedShieldSubscription.paymentMethod.crypto.chainId,
        paymentAddress:
          displayedShieldSubscription.paymentMethod.crypto.payerAddress,
        paymentTokenAddress: currentToken.address,
      },
    };
  }, [
    productInfo,
    currentToken,
    displayedShieldSubscription,
    subscriptionCryptoApprovalAmount,
  ]);

  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(paymentToken);

  const {
    execute: executeUpdateSubscriptionCryptoPaymentMethod,
    result: updateSubscriptionCryptoPaymentMethodResult,
  } = useUpdateSubscriptionCryptoPaymentMethod({
    subscription: currentShieldSubscription,
  });

  const isPaused = useMemo(() => {
    return getIsShieldSubscriptionPaused(subscriptions ?? []);
  }, [subscriptions]);

  const isUnexpectedErrorCryptoPayment = useMemo(() => {
    if (!currentShieldSubscription) {
      return false;
    }
    return (
      isPaused &&
      isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) &&
      !currentShieldSubscription.paymentMethod.crypto.error
    );
  }, [currentShieldSubscription, isPaused]);

  const isInsufficientFundsCrypto = useMemo(() => {
    if (
      !currentShieldSubscription ||
      !isCryptoPaymentMethod(currentShieldSubscription.paymentMethod)
    ) {
      return false;
    }
    return (
      currentShieldSubscription.paymentMethod.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE
    );
  }, [currentShieldSubscription]);

  const isAllowanceNeededCrypto = useMemo(() => {
    if (
      !currentShieldSubscription ||
      !isCryptoPaymentMethod(currentShieldSubscription.paymentMethod)
    ) {
      return false;
    }
    const { error } = currentShieldSubscription.paymentMethod.crypto;
    return (
      error === CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_ALLOWANCE ||
      error === CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_TOO_OLD ||
      error === CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_REVERTED ||
      error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_MAX_VERIFICATION_ATTEMPTS_REACHED
    );
  }, [currentShieldSubscription]);

  const handlePaymentError = useCallback(async () => {
    if (currentShieldSubscription) {
      // capture error state clicked event
      captureShieldErrorStateClickedEvent({
        subscriptionStatus: currentShieldSubscription.status,
        paymentType: currentShieldSubscription.paymentMethod.type,
        billingInterval: currentShieldSubscription.interval,
        errorCause: 'payment_error',
        actionClicked: ShieldErrorStateActionClickedEnum.Cta,
        location: ShieldErrorStateLocationEnum.Settings,
        view: ShieldErrorStateViewEnum.Banner,
      });
    }

    if (isCancelled) {
      // go to shield plan page to renew subscription for cancelled subscription
      navigate({
        pathname: SHIELD_PLAN_ROUTE,
        search: `?source=${ShieldMetricsSourceEnum.Settings}`,
      });
    } else if (isUnexpectedErrorCryptoPayment) {
      // handle support action
      handleClickContactSupport();
    } else if (
      currentShieldSubscription &&
      isCryptoPaymentMethod(currentShieldSubscription.paymentMethod)
    ) {
      if (isInsufficientFundsCrypto) {
        // TODO: handle add funds crypto
        // then use subscription controller to trigger subscription check
        onOpenAddFundsModal();
        // await dispatch(updateSubscriptionCryptoPaymentMethod({
        //   ...params,
        //   rawTransaction: undefined // no raw transaction to trigger server to check for new funded balance
        // }))
      } else if (isAllowanceNeededCrypto) {
        await executeSubscriptionCryptoApprovalTransaction();
      } else {
        throw new Error('Unknown crypto error action');
      }
    } else {
      await executeUpdateSubscriptionCardPaymentMethod();
    }
  }, [
    currentShieldSubscription,
    isCancelled,
    isUnexpectedErrorCryptoPayment,
    isInsufficientFundsCrypto,
    isAllowanceNeededCrypto,
    onOpenAddFundsModal,
    executeSubscriptionCryptoApprovalTransaction,
    executeUpdateSubscriptionCardPaymentMethod,
    handleClickContactSupport,
    navigate,
    captureShieldErrorStateClickedEvent,
  ]);

  // handle payment error for insufficient funds crypto payment
  // need separate handler to not mistake with handlePaymentError for membership error banner
  const handlePaymentErrorInsufficientFunds = useCallback(async () => {
    if (
      !isInsufficientFundsCrypto ||
      !hasAvailableSelectedTokenToTriggerCheckInsufficientFunds
    ) {
      return;
    }

    await handleTriggerSubscriptionCheckInsufficientFunds();
  }, [
    isInsufficientFundsCrypto,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
    handleTriggerSubscriptionCheckInsufficientFunds,
  ]);

  const handlePaymentMethodChange = useCallback(
    async (
      paymentType: PaymentType,
      selectedToken?: TokenWithApprovalAmount,
    ) => {
      try {
        if (paymentType === PAYMENT_TYPES.byCard) {
          await executeUpdateSubscriptionCardPaymentMethod();
        } else if (paymentType === PAYMENT_TYPES.byCrypto) {
          if (!selectedToken) {
            throw new Error('No token selected');
          }
          executeUpdateSubscriptionCryptoPaymentMethod(selectedToken);
        }
      } catch (error) {
        console.error('Error changing payment method', error);
      }
    },
    [
      executeUpdateSubscriptionCardPaymentMethod,
      executeUpdateSubscriptionCryptoPaymentMethod,
    ],
  );

  return {
    handlePaymentError,
    handlePaymentErrorInsufficientFunds,
    handlePaymentMethodChange,
    isUnexpectedErrorCryptoPayment,
    isInsufficientFundsCrypto,
    isAllowanceNeededCrypto,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
    resultTriggerSubscriptionCheckInsufficientFunds,
    updateSubscriptionCardPaymentMethodResult,
    updateSubscriptionCryptoPaymentMethodResult,
    currentToken,
  };
};
