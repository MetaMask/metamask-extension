import React, { useMemo, useState } from 'react';
import { Box, Button, ButtonVariant } from '@metamask/design-system-react';
import {
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ButtonRow,
  ButtonRowContainer,
  MembershipErrorBanner,
} from '../components';
import {
  useCancelSubscription,
  useOpenGetSubscriptionBillingPortal,
  useUnCancelSubscription,
  useUserLastSubscriptionByProduct,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../../hooks/subscription/useSubscription';
import CancelMembershipModal from '../components/cancel-membership-modal';
import ApiErrorHandler from '../../../../components/app/api-error-handler';
import { ShieldUnexpectedErrorEventLocationEnum } from '../../../../../shared/constants/subscriptions';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { getShortDateFormatterV2 } from '../../../asset/util';
import { PaymentMethodRow } from '../payment-method-row';
import { useSubscriptionPricing } from '../../../../hooks/subscription/useSubscriptionPricing';
import { useHandlePayment } from '../../../../hooks/subscription/useHandlePayment';
import {
  getIsShieldSubscriptionEndingSoon,
  getIsShieldSubscriptionPaused,
} from '../../../../../shared/lib/shield';
import { isCardPaymentMethod, isCryptoPaymentMethod } from '../types';
import AddFundsModal from '../../../../components/app/modals/add-funds-modal';
import { ConfirmInfoRowAddress } from '../../../../components/app/confirm/info/row/address';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';

const ManageShieldPlan = ({ isPastPlan = false }: { isPastPlan?: boolean }) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);

  const {
    subscriptions,
    lastSubscription,
    loading: subscriptionsLoading,
    error: subscriptionsError,
  } = useUserSubscriptions();
  const currentShieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const lastShieldSubscription = useUserLastSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    lastSubscription,
  );
  // show current active shield subscription or last subscription if no active subscription
  const displayedShieldSubscription:
    | (Subscription & { rewardAccountId?: string }) // TODO: fix this type once we have controller released.
    | undefined = isPastPlan
    ? lastShieldSubscription
    : (currentShieldSubscription ?? lastShieldSubscription);

  const {
    subscriptionPricing,
    loading: subscriptionPricingLoading,
    error: subscriptionPricingError,
  } = useSubscriptionPricing({
    refetch: true, // need to refetch here in case user already subscribed and doesn't go through shield plan screen
  });

  const isCancelled =
    displayedShieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const isPaused = getIsShieldSubscriptionPaused(subscriptions);
  const isMembershipInactive = isCancelled || isPaused;
  const isSubscriptionEndingSoon =
    getIsShieldSubscriptionEndingSoon(subscriptions);

  // user can cancel subscription if not canceled and current subscription not cancel at period end
  const canCancel =
    !isCancelled &&
    currentShieldSubscription &&
    !currentShieldSubscription?.cancelAtPeriodEnd;

  const isCryptoPayment =
    displayedShieldSubscription?.paymentMethod &&
    isCryptoPaymentMethod(displayedShieldSubscription?.paymentMethod);

  const isCardPayment =
    displayedShieldSubscription &&
    isCardPaymentMethod(displayedShieldSubscription.paymentMethod);

  const {
    handlePaymentError,
    handlePaymentErrorInsufficientFunds,
    handlePaymentMethodChange,
    isUnexpectedErrorCryptoPayment,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
    currentToken,
    resultTriggerSubscriptionCheckInsufficientFunds,
    updateSubscriptionCardPaymentMethodResult,
    updateSubscriptionCryptoPaymentMethodResult,
  } = useHandlePayment({
    currentShieldSubscription,
    displayedShieldSubscription,
    subscriptions,
    isCancelled: isCancelled ?? false,
    subscriptionPricing,
    onOpenAddFundsModal: () => setIsAddFundsModalOpen(true),
  });

  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);
  const [executeCancelSubscription, cancelSubscriptionResult] =
    useCancelSubscription(currentShieldSubscription);

  const [executeUnCancelSubscription, unCancelSubscriptionResult] =
    useUnCancelSubscription(currentShieldSubscription);

  const [
    executeOpenGetSubscriptionBillingPortal,
    openGetSubscriptionBillingPortalResult,
  ] = useOpenGetSubscriptionBillingPortal(displayedShieldSubscription);

  const loading =
    subscriptionsLoading ||
    subscriptionPricingLoading ||
    openGetSubscriptionBillingPortalResult.pending ||
    unCancelSubscriptionResult.pending ||
    cancelSubscriptionResult.pending ||
    updateSubscriptionCardPaymentMethodResult.pending ||
    updateSubscriptionCryptoPaymentMethodResult.pending ||
    resultTriggerSubscriptionCheckInsufficientFunds.pending;
  const hasApiError =
    subscriptionsError ||
    subscriptionPricingError ||
    openGetSubscriptionBillingPortalResult.error ||
    unCancelSubscriptionResult.error ||
    cancelSubscriptionResult.error ||
    updateSubscriptionCardPaymentMethodResult.error ||
    updateSubscriptionCryptoPaymentMethodResult.error ||
    resultTriggerSubscriptionCheckInsufficientFunds.error;

  const billingCycleDescription = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }

    const isYearly =
      displayedShieldSubscription?.interval === RECURRING_INTERVALS.year;
    if (isPastPlan) {
      return isYearly ? t('shieldPlanYearly') : t('shieldPlanMonthly');
    }
    return t('shieldTxDetails2Description', [
      isYearly ? t('shieldPlanYearly') : t('shieldPlanMonthly'),
      getShortDateFormatterV2().format(
        new Date(displayedShieldSubscription?.currentPeriodEnd),
      ),
    ]);
  }, [displayedShieldSubscription, isPastPlan, t]);

  if (!loading && hasApiError) {
    return (
      <Box
        className="transaction-shield-page w-full"
        data-testid="transaction-shield-page"
        padding={4}
      >
        <ApiErrorHandler
          className="transaction-shield-page__error-content mx-auto"
          error={hasApiError}
          location={ShieldUnexpectedErrorEventLocationEnum.TransactionShieldTab}
        />
      </Box>
    );
  }

  return (
    <Box
      className="manage-plan-page w-full h-full flex flex-col"
      data-testid="manage-plan-page"
    >
      <MembershipErrorBanner
        isPaused={isPaused}
        isCryptoPayment={isCryptoPayment ?? false}
        isCardPayment={isCardPayment ?? false}
        isSubscriptionEndingSoon={isSubscriptionEndingSoon}
        currentShieldSubscription={currentShieldSubscription}
        onActionButtonClick={handlePaymentError}
      />
      <Box className="flex-1">
        {displayedShieldSubscription && (
          <ButtonRowContainer>
            {isPastPlan && (
              <ButtonRow
                title={t('shieldTxDetails1Title')}
                description={`${getShortDateFormatterV2().format(new Date(displayedShieldSubscription?.currentPeriodStart))} - ${getShortDateFormatterV2().format(
                  new Date(displayedShieldSubscription?.currentPeriodEnd),
                )}`}
              />
            )}
            <ButtonRow
              title={t('shieldTxDetails2Title')}
              description={billingCycleDescription}
            />
            <PaymentMethodRow
              displayedShieldSubscription={displayedShieldSubscription}
              subscriptionPricing={subscriptionPricing}
              onPaymentMethodChange={handlePaymentMethodChange}
              isCheckSubscriptionInsufficientFundsDisabled={
                !hasAvailableSelectedTokenToTriggerCheckInsufficientFunds
              }
              handlePaymentErrorInsufficientFunds={
                handlePaymentErrorInsufficientFunds
              }
              isPaused={isPaused}
              isUnexpectedErrorCryptoPayment={isUnexpectedErrorCryptoPayment}
              handlePaymentError={handlePaymentError}
            />
            {isCryptoPaymentMethod(
              displayedShieldSubscription.paymentMethod,
            ) && (
              <ButtonRow
                title={t('shieldTxBillingAccount')}
                description={
                  <ConfirmInfoRowAddress
                    address={
                      displayedShieldSubscription.paymentMethod.crypto
                        .payerAddress
                    }
                    chainId={
                      displayedShieldSubscription.paymentMethod.crypto.chainId
                    }
                    showFullName
                  />
                }
              />
            )}
            {!isPastPlan &&
              displayedShieldSubscription?.status !==
                SUBSCRIPTION_STATUSES.provisional && (
                <>
                  <Box className="border-t border-muted w-full h-px" />
                  <ButtonRow
                    data-testid="shield-detail-view-billing-history-button"
                    title={t(
                      'shieldTxMembershipBillingDetailsViewBillingHistory',
                    )}
                    onClick={() => {
                      executeOpenGetSubscriptionBillingPortal();
                    }}
                  />
                </>
              )}
            {isPastPlan &&
              displayedShieldSubscription?.isEligibleForSupport && (
                <>
                  <Box className="border-t border-muted w-full h-px" />
                  <ButtonRow
                    data-testid="shield-detail-submit-case-button"
                    title={t('shieldTxMembershipMakeClaim')}
                    onClick={() => {
                      navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.BASE);
                    }}
                  />
                </>
              )}
          </ButtonRowContainer>
        )}
      </Box>
      <Box className="p-4">
        {!isMembershipInactive &&
          currentShieldSubscription?.cancelAtPeriodEnd && (
            <Button
              data-testid="shield-tx-membership-uncancel-button"
              variant={ButtonVariant.Secondary}
              className="w-full"
              onClick={() => {
                executeUnCancelSubscription();
              }}
            >
              {t('shieldTxMembershipResubscribe')}
            </Button>
          )}
        {/* If cancelled show the invoice button here */}
        {isCancelled && (
          <Button
            data-testid="shield-detail-view-billing-history-button"
            variant={ButtonVariant.Secondary}
            className="w-full"
            onClick={() => {
              executeOpenGetSubscriptionBillingPortal();
            }}
          >
            {t('shieldTxViewPastInvoice')}
          </Button>
        )}
        {canCancel && (
          <Button
            data-testid="shield-tx-membership-cancel-button"
            variant={ButtonVariant.Secondary}
            className="w-full"
            onClick={() => {
              setIsCancelMembershipModalOpen(true);
            }}
          >
            {t('shieldTxMembershipCancel')}
          </Button>
        )}
      </Box>
      {loading && <LoadingScreen />}
      {currentShieldSubscription && isCancelMembershipModalOpen && (
        <CancelMembershipModal
          onClose={() => setIsCancelMembershipModalOpen(false)}
          onConfirm={async () => {
            setIsCancelMembershipModalOpen(false);
            await executeCancelSubscription();
          }}
          subscription={currentShieldSubscription}
        />
      )}
      {currentToken &&
        isAddFundsModalOpen &&
        currentShieldSubscription &&
        isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) && (
          <AddFundsModal
            onClose={() => {
              setIsAddFundsModalOpen(false);
            }}
            token={currentToken}
            chainId={currentShieldSubscription.paymentMethod.crypto.chainId}
            payerAddress={
              currentShieldSubscription.paymentMethod.crypto.payerAddress
            }
          />
        )}
    </Box>
  );
};

export default ManageShieldPlan;
