import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  ProductType,
  RecurringInterval,
  Subscription,
  SubscriptionEligibility,
  SubscriptionStatus,
  ModalType,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import {
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getUserSubscriptions } from '../../selectors/subscription';
import {
  addTransaction,
  cancelSubscription,
  estimateGas,
  getSubscriptionBillingPortalUrl,
  getSubscriptions,
  getSubscriptionsEligibilities,
  setDefaultSubscriptionPaymentOptions,
  setLastUsedSubscriptionPaymentDetails,
  startSubscriptionWithCard,
  unCancelSubscription,
  updateSubscriptionCardPaymentMethod,
} from '../../store/actions';
import { useAsyncCallback, useAsyncResult } from '../useAsync';
import { MetaMaskReduxDispatch } from '../../store/store';
import {
  selectIsSignedIn,
  selectSessionData,
} from '../../selectors/identity/authentication';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  getIsShieldSubscriptionActive,
  getIsShieldSubscriptionPaused,
  getSubscriptionDurationInDays,
  getSubscriptionPaymentData,
} from '../../../shared/lib/shield';
import { generateERC20ApprovalData } from '../../pages/confirmations/send-legacy/send.utils';
import { decimalToHex } from '../../../shared/modules/conversion.utils';
import {
  CONFIRM_TRANSACTION_ROUTE,
  SHIELD_PLAN_ROUTE,
} from '../../helpers/constants/routes';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  getMetaMetricsId,
  getModalTypeForShieldEntryModal,
  getUnapprovedConfirmations,
} from '../../selectors';
import { useSubscriptionMetrics } from '../shield/metrics/useSubscriptionMetrics';
import { CaptureShieldSubscriptionRequestParams } from '../shield/metrics/types';
import {
  EntryModalSourceEnum,
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
} from '../../../shared/constants/subscriptions';
import { DefaultSubscriptionPaymentOptions } from '../../../shared/types';
import {
  getLatestSubscriptionStatus,
  getShieldMarketingUtmParamsForMetrics,
  getUserBalanceCategory,
  SHIELD_SUBSCRIPTION_CARD_TAB_ACTION_ERROR_MESSAGE,
} from '../../../shared/modules/shield';
import { openWindow } from '../../helpers/utils/window';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { useAccountTotalFiatBalance } from '../useAccountTotalFiatBalance';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { isCryptoPaymentMethod } from '../../pages/settings/transaction-shield-tab/types';
import {
  TokenWithApprovalAmount,
  useSubscriptionPricing,
} from './useSubscriptionPricing';
import {
  useHandleShieldAddFundTrigger,
  useShieldSubscriptionCryptoSufficientBalanceCheck,
} from './useAddFundTrigger';

/**
 * get user subscriptions information
 *
 * @param options - The options for the hook.
 * @param options.refetch - whether to refetch the subscriptions
 * @returns user subscriptions information
 */
export const useUserSubscriptions = (
  { refetch }: { refetch?: boolean } = { refetch: false },
) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const userSubscriptions = useSelector(getUserSubscriptions);

  const result = useAsyncResult(async () => {
    if (!refetch) {
      return undefined;
    }
    return await dispatch(getSubscriptions());
  }, [refetch, dispatch]);

  return {
    ...userSubscriptions,
    loading: result.pending,
    error: result.error,
  };
};

/**
 * get user subscription by product from list of subscriptions
 *
 * @param product - The product to get the subscription for.
 * @param subscriptions - The subscriptions to get the subscription from.
 * @returns The subscription for the product.
 */
export const useUserSubscriptionByProduct = (
  product: ProductType,
  subscriptions?: Subscription[],
): Subscription | undefined => {
  return useMemo(
    () =>
      subscriptions?.find((subscription) =>
        subscription.products.some((p) => p.name === product),
      ),
    [subscriptions, product],
  );
};

/**
 * get user last subscription by product
 *
 * @param product - The product to get the subscription for.
 * @param lastSubscription - The last subscription to get the subscription from.
 * @returns The subscription for the product.
 */
export const useUserLastSubscriptionByProduct = (
  product: ProductType,
  lastSubscription?: Subscription,
): Subscription | undefined => {
  return useMemo(
    () =>
      lastSubscription?.products.some((p) => p.name === product)
        ? lastSubscription
        : undefined,
    [lastSubscription, product],
  );
};

export const useCancelSubscription = (subscription?: Subscription) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { captureShieldMembershipCancelledEvent } = useSubscriptionMetrics();

  const latestSubscriptionDuration = useMemo(() => {
    return subscription ? getSubscriptionDurationInDays(subscription) : 0;
  }, [subscription]);

  const trackMembershipCancelledEvent = useCallback(
    (cancellationStatus: 'succeeded' | 'failed', errorMessage?: string) => {
      if (!subscription) {
        return;
      }

      const { cryptoPaymentChain, cryptoPaymentCurrency } =
        getSubscriptionPaymentData(subscription);

      // capture the event when the Shield membership is cancelled
      captureShieldMembershipCancelledEvent({
        subscriptionStatus: subscription.status,
        paymentType: subscription.paymentMethod.type,
        billingInterval: subscription.interval,
        cryptoPaymentChain,
        cryptoPaymentCurrency,
        cancellationStatus,
        errorMessage,
        latestSubscriptionDuration,
      });
    },
    [
      subscription,
      captureShieldMembershipCancelledEvent,
      latestSubscriptionDuration,
    ],
  );

  return useAsyncCallback(async () => {
    try {
      if (!subscription) {
        return;
      }
      const subscriptionId = subscription.id;
      await dispatch(cancelSubscription({ subscriptionId }));
      trackMembershipCancelledEvent('succeeded');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      trackMembershipCancelledEvent('failed', errorMessage);
      throw error;
    }
  }, [dispatch, subscription, captureShieldMembershipCancelledEvent]);
};

export const useUnCancelSubscription = (subscription?: Subscription) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { captureShieldSubscriptionRestartRequestEvent } =
    useSubscriptionMetrics();

  const trackSubscriptionUncancelRequestEvent = useCallback(
    (status: 'completed' | 'failed', errorMessage?: string) => {
      if (!subscription) {
        return;
      }
      const { cryptoPaymentChain, cryptoPaymentCurrency } =
        getSubscriptionPaymentData(subscription);

      // capture the event when the subscription restart request is triggered
      captureShieldSubscriptionRestartRequestEvent({
        subscriptionStatus: subscription.status,
        paymentType: subscription.paymentMethod.type,
        billingInterval: subscription.interval,
        cryptoPaymentChain,
        cryptoPaymentCurrency,
        requestStatus: status,
        errorMessage,
      });
    },
    [captureShieldSubscriptionRestartRequestEvent, subscription],
  );

  return useAsyncCallback(async () => {
    try {
      const subscriptionId = subscription?.id;
      if (!subscriptionId) {
        return;
      }
      await dispatch(unCancelSubscription({ subscriptionId }));
      trackSubscriptionUncancelRequestEvent('completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      trackSubscriptionUncancelRequestEvent('failed', errorMessage);
      throw error;
    }
  }, [dispatch, subscription, trackSubscriptionUncancelRequestEvent]);
};

export const useOpenGetSubscriptionBillingPortal = (
  subscription?: Subscription,
) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { captureCommonExistingShieldSubscriptionEvents } =
    useSubscriptionMetrics();

  const trackBillingHistoryOpenedEvent = useCallback(() => {
    if (!subscription) {
      return;
    }
    const { cryptoPaymentChain, cryptoPaymentCurrency } =
      getSubscriptionPaymentData(subscription);

    // capture the event when the billing history is opened
    captureCommonExistingShieldSubscriptionEvents(
      {
        subscriptionStatus: subscription.status,
        paymentType: subscription.paymentMethod.type,
        billingInterval: subscription.interval,
        cryptoPaymentChain,
        cryptoPaymentCurrency,
      },
      MetaMetricsEventName.ShieldBillingHistoryOpened,
    );
  }, [captureCommonExistingShieldSubscriptionEvents, subscription]);

  return useAsyncCallback(async () => {
    const { url } = await dispatch(getSubscriptionBillingPortalUrl());
    trackBillingHistoryOpenedEvent();
    return await platform.openTab({ url });
  }, [dispatch, trackBillingHistoryOpenedEvent]);
};

export const useUpdateSubscriptionCardPaymentMethod = ({
  subscription,
  newRecurringInterval,
}: {
  subscription?: Subscription;
  newRecurringInterval?: RecurringInterval;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { captureCommonExistingShieldSubscriptionEvents } =
    useSubscriptionMetrics();

  return useAsyncCallback(async () => {
    if (!subscription || !newRecurringInterval) {
      throw new Error('Subscription ID and recurring interval are required');
    }

    const subscriptionId = subscription.id;

    await dispatch(
      updateSubscriptionCardPaymentMethod({
        subscriptionId,
        paymentType: PAYMENT_TYPES.byCard,
        recurringInterval: newRecurringInterval,
      }),
    );

    // capture the event when the payment method is updated
    captureCommonExistingShieldSubscriptionEvents(
      {
        subscriptionStatus: subscription.status,
        paymentType: subscription.paymentMethod.type,
        billingInterval: newRecurringInterval,
      },
      MetaMetricsEventName.ShieldPaymentMethodUpdated,
    );
  }, [
    dispatch,
    subscription,
    newRecurringInterval,
    captureCommonExistingShieldSubscriptionEvents,
  ]);
};

export const useSubscriptionCryptoApprovalTransaction = (
  selectedToken?: Pick<
    TokenWithApprovalAmount,
    'chainId' | 'address' | 'approvalAmount'
  >,
) => {
  const navigate = useNavigate();
  const { subscriptionPricing } = useSubscriptionPricing();
  const evmInternalAccount = useSelector((state) =>
    // Account address will be the same for all EVM accounts
    getInternalAccountBySelectedAccountGroupAndCaip(state, 'eip155:1'),
  );
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const hasPendingApprovals =
    useSelector(getUnapprovedConfirmations).length > 0;
  const [shieldTransactionDispatched, setShieldTransactionDispatched] =
    useState(false);

  useEffect(() => {
    // navigate to confirmation page if there are pending approvals and shield transaction is dispatched
    // need to handle here instead of right after `await addTransaction` because approval is not created right after `addTransaction` completed
    if (hasPendingApprovals && shieldTransactionDispatched) {
      navigate(CONFIRM_TRANSACTION_ROUTE);
    }
  }, [hasPendingApprovals, shieldTransactionDispatched, navigate]);

  const handler = useCallback(async () => {
    if (!subscriptionPricing) {
      throw new Error('Subscription pricing not found');
    }

    if (!selectedToken) {
      throw new Error('No token selected');
    }

    const networkConfiguration =
      networkConfigurationsByChainId[selectedToken.chainId as Hex];
    const networkClientId =
      networkConfiguration?.rpcEndpoints[
        networkConfiguration.defaultRpcEndpointIndex ?? 0
      ]?.networkClientId;

    const spenderAddress = subscriptionPricing?.paymentMethods
      ?.find((method) => method.type === PAYMENT_TYPES.byCrypto)
      ?.chains?.find(
        (chain) => chain.chainId === selectedToken?.chainId,
      )?.paymentAddress;
    const approvalData = generateERC20ApprovalData({
      spenderAddress,
      amount: decimalToHex(selectedToken.approvalAmount.approveAmount),
    });
    const transactionParams: TransactionParams = {
      from: evmInternalAccount?.address as Hex,
      to: selectedToken.address as Hex,
      value: '0x0',
      data: approvalData,
    };
    transactionParams.gas = await estimateGas(transactionParams);
    const transactionOptions = {
      type: TransactionType.shieldSubscriptionApprove,
      networkClientId: networkClientId as string,
    };
    await addTransaction(transactionParams, transactionOptions);
    setShieldTransactionDispatched(true);
  }, [
    setShieldTransactionDispatched,
    subscriptionPricing,
    evmInternalAccount,
    networkConfigurationsByChainId,
    selectedToken,
  ]);

  return {
    execute: handler,
  };
};

/**
 * Hook to get the eligibility of a subscription for a given product.
 *
 * @param product - The product to get the eligibility for.
 * @returns An object with the getSubscriptionEligibility function.
 */
export const useSubscriptionEligibility = (product: ProductType) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const isUnlocked = useSelector(getIsUnlocked);
  const evmInternalAccount = useSelector((state) =>
    // Account address will be the same for all EVM accounts
    getInternalAccountBySelectedAccountGroupAndCaip(state, 'eip155:1'),
  );
  const { totalFiatBalance } = useAccountTotalFiatBalance(
    evmInternalAccount,
    false,
    true, // use USD conversion rate instead of the current currency
  );

  const getSubscriptionEligibility = useCallback(async (): Promise<
    SubscriptionEligibility | undefined
  > => {
    try {
      // if user is not signed in or unlocked, return undefined
      if (!isSignedIn || !isUnlocked) {
        return undefined;
      }

      const balanceCategory = getUserBalanceCategory(Number(totalFiatBalance));

      // get the subscriptions before making the eligibility request
      // here, we cannot `useUserSubscriptions` hook as the hook's initial state has empty subscriptions array and loading state is false
      // that mistakenly makes `user does not have a subscription` and triggers the eligibility request
      const subscriptions = await dispatch(getSubscriptions());
      const isShieldSubscriptionActive =
        getIsShieldSubscriptionActive(subscriptions);

      if (!isShieldSubscriptionActive) {
        // only if shield subscription is not active, get the eligibility
        const eligibilities = await dispatch(
          getSubscriptionsEligibilities({ balanceCategory }),
        );
        return eligibilities.find(
          (eligibility) => eligibility.product === product,
        );
      }
      return undefined;
    } catch (error) {
      log.warn('[useSubscriptionEligibility] error', error);
      return undefined;
    }
  }, [isSignedIn, isUnlocked, dispatch, product, totalFiatBalance]);

  return {
    getSubscriptionEligibility,
  };
};

/**
 * Hook to handle the subscription request.
 *
 * @param options - The options for the subscription request.
 * @param options.subscriptionState - The state of the subscription before the request was started (cancelled, expired, etc.).
 * @param options.selectedPaymentMethod - The payment method selected by the user.
 * @param options.selectedToken - The token selected by the user.
 * @param options.selectedPlan - The plan selected by the user.
 * @param options.defaultOptions - The default options for the subscription request.
 * @param options.isTrialed - Whether the user is trialing the subscription.
 * @param options.useTestClock - Whether to use a test clock for the subscription.
 * @returns An object with the handleSubscription function and the subscription result.
 */
export const useHandleSubscription = ({
  selectedPaymentMethod,
  selectedToken,
  selectedPlan,
  defaultOptions,
  isTrialed,
  useTestClock = false,
}: {
  defaultOptions: DefaultSubscriptionPaymentOptions;
  subscriptionState?: SubscriptionStatus;
  selectedPaymentMethod: PaymentType;
  selectedPlan: RecurringInterval;
  isTrialed: boolean;
  selectedToken?: TokenWithApprovalAmount;
  useTestClock?: boolean;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { search } = useLocation();
  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(selectedToken);
  const { subscriptions, lastSubscription } = useUserSubscriptions();
  const {
    captureShieldSubscriptionRequestEvent,
    setShieldSubscriptionMetricsPropsToBackground,
  } = useSubscriptionMetrics();
  const modalType: ModalType = useSelector(getModalTypeForShieldEntryModal);

  const latestSubscriptionStatus =
    getLatestSubscriptionStatus(subscriptions, lastSubscription) || 'none';

  const determineSubscriptionRequestSource =
    useCallback((): EntryModalSourceEnum => {
      const marketingUtmParams = getShieldMarketingUtmParamsForMetrics(search);
      if (Object.keys(marketingUtmParams).length > 0) {
        return EntryModalSourceEnum.Marketing;
      }
      const sourceParam = new URLSearchParams(search).get('source');
      switch (sourceParam) {
        case 'homepage':
          return EntryModalSourceEnum.Homepage;
        case 'post_transaction':
          return EntryModalSourceEnum.PostTransaction;
        case 'notification':
          return EntryModalSourceEnum.Notification;
        case 'carousel':
          return EntryModalSourceEnum.Carousel;
        case 'marketing':
          return EntryModalSourceEnum.Marketing;
        case 'settings':
        default:
          return EntryModalSourceEnum.Settings;
      }
    }, [search]);

  const [handleSubscription, subscriptionResult] =
    useAsyncCallback(async () => {
      // save the last used subscription payment method and plan to Redux store
      await dispatch(
        setLastUsedSubscriptionPaymentDetails(PRODUCT_TYPES.SHIELD, {
          type: selectedPaymentMethod,
          paymentTokenAddress: selectedToken?.address as Hex,
          paymentTokenSymbol: selectedToken?.symbol,
          plan: selectedPlan,
          useTestClock,
        }),
      );

      const marketingUtmParams = getShieldMarketingUtmParamsForMetrics(search);

      // We need to pass the default payment options & some metrics properties to the background app state controller
      // as these properties are not accessible in the background directly.
      // Shield subscription metrics requests can use them for the metrics capture
      // and also the background app state controller can use them for the metrics capture
      await dispatch(setDefaultSubscriptionPaymentOptions(defaultOptions));
      await setShieldSubscriptionMetricsPropsToBackground({
        source: determineSubscriptionRequestSource(),
        marketingUtmParams,
      });

      const source = determineSubscriptionRequestSource();
      const subscriptionRequestTrackingParams: Omit<
        CaptureShieldSubscriptionRequestParams,
        'requestStatus'
      > = {
        subscriptionState: latestSubscriptionStatus,
        defaultPaymentType: defaultOptions.defaultPaymentType,
        defaultPaymentCurrency: defaultOptions.defaultPaymentCurrency,
        defaultBillingInterval: defaultOptions.defaultBillingInterval,
        defaultPaymentChain: defaultOptions.defaultPaymentChain,
        paymentType: selectedPaymentMethod,
        paymentCurrency: 'USD',
        isTrialSubscription: !isTrialed,
        billingInterval: selectedPlan,
        source,
        type: modalType,
        marketingUtmParams,
      };

      if (selectedPaymentMethod === PAYMENT_TYPES.byCard) {
        // capture the event when the Shield subscription request is started
        captureShieldSubscriptionRequestEvent({
          ...subscriptionRequestTrackingParams,
          paymentCurrency: 'USD',
          requestStatus: 'started',
        });
        try {
          await dispatch(
            startSubscriptionWithCard({
              products: [PRODUCT_TYPES.SHIELD],
              isTrialRequested: !isTrialed,
              recurringInterval: selectedPlan,
              useTestClock,
            }),
          );
        } catch (e) {
          if (
            e instanceof Error &&
            e.message
              .toLowerCase()
              .includes(
                SHIELD_SUBSCRIPTION_CARD_TAB_ACTION_ERROR_MESSAGE.toLowerCase(),
              )
          ) {
            // tab action failed is not api error, only log it here
            console.error('[useHandleSubscription error]:', e);
          } else {
            throw e;
          }
        }
      } else if (selectedPaymentMethod === PAYMENT_TYPES.byCrypto) {
        await executeSubscriptionCryptoApprovalTransaction();
      }
    }, [
      dispatch,
      defaultOptions,
      isTrialed,
      selectedPaymentMethod,
      selectedPlan,
      selectedToken,
      executeSubscriptionCryptoApprovalTransaction,
      useTestClock,
      captureShieldSubscriptionRequestEvent,
      latestSubscriptionStatus,
      modalType,
      determineSubscriptionRequestSource,
      search,
    ]);

  return {
    handleSubscription,
    subscriptionResult,
  };
};

export const useHandleSubscriptionSupportAction = () => {
  const version = process.env.METAMASK_VERSION as string;
  const sessionData = useSelector(selectSessionData);
  const profileId = sessionData?.profile?.profileId;
  const metaMetricsId = useSelector(getMetaMetricsId);
  const { customerId: shieldCustomerId } = useUserSubscriptions();

  const handleClickContactSupport = useCallback(() => {
    let supportLinkWithUserId = SUPPORT_LINK as string;
    const queryParams = new URLSearchParams();
    queryParams.append('metamask_version', version);
    if (profileId) {
      queryParams.append('metamask_profile_id', profileId);
    }
    if (metaMetricsId) {
      queryParams.append('metamask_metametrics_id', metaMetricsId);
    }
    if (shieldCustomerId) {
      queryParams.append('shield_id', shieldCustomerId);
    }

    const queryString = queryParams.toString();
    if (queryString) {
      supportLinkWithUserId += `?${queryString}`;
    }

    openWindow(supportLinkWithUserId);
  }, [version, profileId, metaMetricsId, shieldCustomerId]);

  return {
    handleClickContactSupport,
  };
};

export const useUpdateSubscriptionCryptoPaymentMethod = ({
  subscription,
  selectedToken,
}: {
  subscription?: Subscription;
  selectedToken?: Pick<
    TokenWithApprovalAmount,
    'chainId' | 'address' | 'approvalAmount' | 'symbol'
  >;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(selectedToken);
  // This update the subscription payment method to crypto
  // and trigger the approval transaction flow
  const [handler, result] = useAsyncCallback(async () => {
    if (!subscription) {
      throw new Error('No subscription exist');
    }
    // only allow update payment method to crypto -> crypto atm
    if (!isCryptoPaymentMethod(subscription.paymentMethod)) {
      throw new Error('Subscription is not a crypto payment method');
    }
    if (!selectedToken) {
      throw new Error('No token selected');
    }

    // save the changing payment method as last used subscription payment method and plan to Redux store
    await dispatch(
      setLastUsedSubscriptionPaymentDetails(PRODUCT_TYPES.SHIELD, {
        type: PAYMENT_TYPES.byCrypto,
        paymentTokenAddress: selectedToken.address as Hex,
        paymentTokenSymbol: selectedToken.symbol,
        plan: subscription.interval,
      }),
    );
    await executeSubscriptionCryptoApprovalTransaction();
  }, [
    subscription,
    executeSubscriptionCryptoApprovalTransaction,
    dispatch,
    selectedToken,
  ]);
  return {
    execute: handler,
    result,
  };
};

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
