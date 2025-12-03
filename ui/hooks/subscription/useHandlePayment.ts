import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PaymentType,
  Subscription,
} from '@metamask/subscription-controller';
import { getIsShieldSubscriptionPaused } from '../../../shared/lib/shield';
import { useSubscriptionMetrics } from '../shield/metrics/useSubscriptionMetrics';
import {
  EntryModalSourceEnum,
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../shared/constants/subscriptions';
import { SHIELD_PLAN_ROUTE } from '../../helpers/constants/routes';
import { isCryptoPaymentMethod } from '../../pages/settings/transaction-shield-tab/types';
import {
  TokenWithApprovalAmount,
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
 * @param options.subscription - The current subscription.
 * @param options.subscriptions - The list of subscriptions to check paused status.
 * @param options.isCancelled - Whether the subscription is cancelled.
 * @param options.onOpenAddFundsModal - Callback to open the add funds modal.
 * @param options.paymentToken
 * @returns An object containing the handlePaymentError function, handlePaymentErrorInsufficientFunds function, handlePaymentMethodChange function, and payment error flags.
 */
export const useHandlePayment = ({
  subscription,
  subscriptions,
  isCancelled,
  paymentToken,
  onOpenAddFundsModal,
}: {
  subscription?: Subscription;
  subscriptions?: Subscription[];
  isCancelled: boolean;
  paymentToken?: Pick<
    TokenWithApprovalAmount,
    'chainId' | 'address' | 'approvalAmount' | 'symbol'
  >;
  onOpenAddFundsModal: () => void;
}) => {
  const navigate = useNavigate();
  const { captureShieldErrorStateClickedEvent } = useSubscriptionMetrics();

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
    subscription,
    newRecurringInterval: subscription?.interval,
  });

  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(paymentToken);

  const [selectedChangePaymentToken, setSelectedChangePaymentToken] = useState<
    | Pick<
        TokenWithApprovalAmount,
        'chainId' | 'address' | 'approvalAmount' | 'symbol'
      >
    | undefined
  >();

  const {
    execute: executeUpdateSubscriptionCryptoPaymentMethod,
    result: updateSubscriptionCryptoPaymentMethodResult,
  } = useUpdateSubscriptionCryptoPaymentMethod({
    subscription,
    selectedToken: selectedChangePaymentToken,
  });

  // trigger update subscription crypto payment method when selected change payment token changes
  useEffect(() => {
    if (selectedChangePaymentToken) {
      executeUpdateSubscriptionCryptoPaymentMethod().then(() => {
        // reset selected change payment token after update subscription crypto payment method succeeded
        setSelectedChangePaymentToken(undefined);
      });
    }
  }, [
    selectedChangePaymentToken,
    executeUpdateSubscriptionCryptoPaymentMethod,
    setSelectedChangePaymentToken,
  ]);

  const { handleClickContactSupport } = useHandleSubscriptionSupportAction();

  const isPaused = useMemo(() => {
    return getIsShieldSubscriptionPaused(subscriptions ?? []);
  }, [subscriptions]);

  const isUnexpectedErrorCryptoPayment = useMemo(() => {
    if (!subscription) {
      return false;
    }
    return (
      isPaused &&
      isCryptoPaymentMethod(subscription.paymentMethod) &&
      !subscription.paymentMethod.crypto.error
    );
  }, [subscription, isPaused]);

  const isInsufficientFundsCrypto = useMemo(() => {
    if (!subscription || !isCryptoPaymentMethod(subscription.paymentMethod)) {
      return false;
    }
    return (
      subscription.paymentMethod.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE
    );
  }, [subscription]);

  const isAllowanceNeededCrypto = useMemo(() => {
    if (!subscription || !isCryptoPaymentMethod(subscription.paymentMethod)) {
      return false;
    }
    const { error } = subscription.paymentMethod.crypto;
    return (
      error === CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_ALLOWANCE ||
      error === CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_TOO_OLD ||
      error === CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_REVERTED ||
      error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_MAX_VERIFICATION_ATTEMPTS_REACHED
    );
  }, [subscription]);

  const handlePaymentError = useCallback(async () => {
    if (subscription) {
      // capture error state clicked event
      captureShieldErrorStateClickedEvent({
        subscriptionStatus: subscription.status,
        paymentType: subscription.paymentMethod.type,
        billingInterval: subscription.interval,
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
        search: `?source=${EntryModalSourceEnum.Settings}`,
      });
    } else if (isUnexpectedErrorCryptoPayment) {
      // handle support action
      handleClickContactSupport();
    } else if (
      subscription &&
      isCryptoPaymentMethod(subscription.paymentMethod)
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
    subscription,
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
          setSelectedChangePaymentToken(selectedToken);
        }
      } catch (error) {
        console.error('Error changing payment method', error);
      }
    },
    [executeUpdateSubscriptionCardPaymentMethod, setSelectedChangePaymentToken],
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
  };
};

