import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import {
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  ProductType,
  RecurringInterval,
  Subscription,
  BalanceCategory,
  SubscriptionEligibility,
  SubscriptionStatus,
  ModalType,
} from '@metamask/subscription-controller';
import log from 'loglevel';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import { selectIsSignedIn } from '../../selectors/identity/authentication';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  getIsShieldSubscriptionActive,
  getSubscriptionDurationInDays,
  getSubscriptionPaymentData,
} from '../../../shared/lib/shield';
import { generateERC20ApprovalData } from '../../pages/confirmations/send-legacy/send.utils';
import { decimalToHex } from '../../../shared/modules/conversion.utils';
import { CONFIRM_TRANSACTION_ROUTE } from '../../helpers/constants/routes';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import {
  getModalTypeForShieldEntryModal,
  selectNetworkConfigurationByChainId,
} from '../../selectors';
import { useSubscriptionMetrics } from '../shield/metrics/useSubscriptionMetrics';
import { CaptureShieldSubscriptionRequestParams } from '../shield/metrics/types';
import { EntryModalSourceEnum } from '../../../shared/constants/subscriptions';
import { DefaultSubscriptionPaymentOptions } from '../../../shared/types';
import { getLatestSubscriptionStatus } from '../../../shared/modules/shield';
import {
  TokenWithApprovalAmount,
  useSubscriptionPricing,
} from './useSubscriptionPricing';

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
  const isSignedIn = useSelector(selectIsSignedIn);
  const isUnlocked = useSelector(getIsUnlocked);
  const userSubscriptions = useSelector(getUserSubscriptions);

  const result = useAsyncResult(async () => {
    if (!isSignedIn || !refetch || !isUnlocked) {
      return undefined;
    }
    return await dispatch(getSubscriptions());
  }, [refetch, dispatch, isSignedIn, isUnlocked]);

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

export const useUnCancelSubscription = ({
  subscriptionId,
}: {
  subscriptionId?: string;
}) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  return useAsyncCallback(async () => {
    if (!subscriptionId) {
      return;
    }
    await dispatch(unCancelSubscription({ subscriptionId }));
  }, [dispatch, subscriptionId]);
};

export const useOpenGetSubscriptionBillingPortal = (
  subscription?: Subscription,
) => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { captureShieldBillingHistoryOpenedEvent } = useSubscriptionMetrics();

  const trackBillingHistoryOpenedEvent = useCallback(() => {
    if (!subscription) {
      return;
    }
    const { cryptoPaymentChain, cryptoPaymentCurrency } =
      getSubscriptionPaymentData(subscription);

    // capture the event when the billing history is opened
    captureShieldBillingHistoryOpenedEvent({
      subscriptionStatus: subscription.status,
      paymentType: subscription.paymentMethod.type,
      billingInterval: subscription.interval,
      cryptoPaymentChain,
      cryptoPaymentCurrency,
    });
  }, [captureShieldBillingHistoryOpenedEvent, subscription]);

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
  const { captureShieldPaymentMethodUpdatedEvent } = useSubscriptionMetrics();

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
    captureShieldPaymentMethodUpdatedEvent({
      subscriptionStatus: subscription.status,
      paymentType: subscription.paymentMethod.type,
      billingInterval: newRecurringInterval,
    });
  }, [dispatch, subscription, newRecurringInterval]);
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
  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, selectedToken?.chainId as Hex),
  );
  const networkClientId =
    networkConfiguration?.rpcEndpoints[
      networkConfiguration.defaultRpcEndpointIndex ?? 0
    ]?.networkClientId;

  const handler = useCallback(async () => {
    if (!subscriptionPricing) {
      throw new Error('Subscription pricing not found');
    }

    if (!selectedToken) {
      throw new Error('No token selected');
    }

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
    navigate(CONFIRM_TRANSACTION_ROUTE);
  }, [
    navigate,
    subscriptionPricing,
    evmInternalAccount,
    selectedToken,
    networkClientId,
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

  const getSubscriptionEligibility = useCallback(
    async (params?: {
      balanceCategory?: BalanceCategory;
    }): Promise<SubscriptionEligibility | undefined> => {
      try {
        // if user is not signed in or unlocked, return undefined
        if (!isSignedIn || !isUnlocked) {
          return undefined;
        }

        // get the subscriptions before making the eligibility request
        // here, we cannot `useUserSubscriptions` hook as the hook's initial state has empty subscriptions array and loading state is false
        // that mistakenly makes `user does not have a subscription` and triggers the eligibility request
        const subscriptions = await dispatch(getSubscriptions());
        const isShieldSubscriptionActive =
          getIsShieldSubscriptionActive(subscriptions);

        if (!isShieldSubscriptionActive) {
          // only if shield subscription is not active, get the eligibility
          const eligibilities = await dispatch(
            getSubscriptionsEligibilities(params),
          );
          return eligibilities.find(
            (eligibility) => eligibility.product === product,
          );
        }
        return undefined;
      } catch (error) {
        log.error('[useSubscriptionEligibility] error', error);
        return undefined;
      }
    },
    [isSignedIn, isUnlocked, dispatch, product],
  );

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
  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(selectedToken);
  const { subscriptions, lastSubscription } = useUserSubscriptions();
  const { captureShieldSubscriptionRequestEvent } = useSubscriptionMetrics();
  const modalType: ModalType = useSelector(getModalTypeForShieldEntryModal);

  const latestSubscriptionStatus =
    getLatestSubscriptionStatus(subscriptions, lastSubscription) || 'none';

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

      // We need to pass the default options to the background app state controller
      // so that the Shield subscription request can use it for the metrics capture
      await dispatch(setDefaultSubscriptionPaymentOptions(defaultOptions));

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
        source: EntryModalSourceEnum.Settings,
        type: modalType,
      };

      if (selectedPaymentMethod === PAYMENT_TYPES.byCard) {
        // capture the event when the Shield subscription request is started
        captureShieldSubscriptionRequestEvent({
          ...subscriptionRequestTrackingParams,
          paymentCurrency: 'USD',
          requestStatus: 'started',
        });
        await dispatch(
          startSubscriptionWithCard({
            products: [PRODUCT_TYPES.SHIELD],
            isTrialRequested: !isTrialed,
            recurringInterval: selectedPlan,
            useTestClock,
          }),
        );
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
    ]);

  return {
    handleSubscription,
    subscriptionResult,
  };
};
