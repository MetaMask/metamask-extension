import { useCallback, useMemo } from 'react';
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
import { TokenWithApprovalAmount } from './useSubscriptionPricing';
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
  currentShieldSubscription,
  subscriptions,
  isCancelled,
  paymentToken,
  onOpenAddFundsModal,
}: {
  currentShieldSubscription?: Subscription;
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
    subscription: currentShieldSubscription,
    newRecurringInterval: currentShieldSubscription?.interval,
  });

  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(paymentToken);

  const {
    execute: executeUpdateSubscriptionCryptoPaymentMethod,
    result: updateSubscriptionCryptoPaymentMethodResult,
  } = useUpdateSubscriptionCryptoPaymentMethod({
    subscription: currentShieldSubscription,
  });

  const { handleClickContactSupport } = useHandleSubscriptionSupportAction();

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
        search: `?source=${EntryModalSourceEnum.Settings}`,
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
  };
};
