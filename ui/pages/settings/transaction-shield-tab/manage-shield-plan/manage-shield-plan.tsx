import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonVariant,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ButtonRow, ButtonRowContainer } from '../components';
import {
  useCancelSubscription,
  useOpenGetSubscriptionBillingPortal,
  useUnCancelSubscription,
  useUserLastSubscriptionByProduct,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../../hooks/subscription/useSubscription';
import CancelMembershipModal from '../cancel-membership-modal';
import ApiErrorHandler from '../../../../components/app/api-error-handler';
import { ShieldUnexpectedErrorEventLocationEnum } from '../../../../../shared/constants/subscriptions';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { getShortDateFormatterV2 } from '../../../asset/util';
import { PaymentMethodRow } from '../payment-method-row';
import { useSubscriptionPricing } from '../../../../hooks/subscription/useSubscriptionPricing';
import { useHandlePayment } from '../../../../hooks/subscription/useHandlePayment';
import { getIsShieldSubscriptionPaused } from '../../../../../shared/lib/shield';

const ManageShieldPlan = () => {
  const t = useI18nContext();

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
    | undefined = currentShieldSubscription ?? lastShieldSubscription;

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

  // user can cancel subscription if not canceled and current subscription not cancel at period end
  const canCancel =
    !isCancelled && !currentShieldSubscription?.cancelAtPeriodEnd;

  const {
    handlePaymentError,
    handlePaymentErrorInsufficientFunds,
    handlePaymentMethodChange,
    isUnexpectedErrorCryptoPayment,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
  } = useHandlePayment({
    currentShieldSubscription,
    displayedShieldSubscription,
    subscriptions,
    isCancelled: isCancelled ?? false,
    subscriptionPricing,
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
    cancelSubscriptionResult.pending;
  const hasApiError =
    subscriptionsError ||
    subscriptionPricingError ||
    openGetSubscriptionBillingPortalResult.error ||
    unCancelSubscriptionResult.error ||
    cancelSubscriptionResult.error;

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
      <Box className="flex-1">
        {displayedShieldSubscription && (
          <ButtonRowContainer>
            <ButtonRow
              title={t('shieldTxDetails2Title')}
              description={t('shieldTxDetails2Description', [
                displayedShieldSubscription?.interval ===
                RECURRING_INTERVALS.year
                  ? t('shieldPlanAnnual')
                  : t('shieldPlanMonthly'),
                getShortDateFormatterV2().format(
                  new Date(displayedShieldSubscription?.currentPeriodEnd),
                ),
              ])}
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
            {displayedShieldSubscription?.status !==
              SUBSCRIPTION_STATUSES.provisional && (
              <>
                <Box className="border-t border-muted w-full h-px" />
                <ButtonRow
                  data-testid="shield-detail-view-billing-history-button"
                  title={t(
                    'shieldTxMembershipBillingDetailsViewBillingHistory',
                  )}
                  endIconName={IconName.ArrowRight}
                  onClick={() => {
                    executeOpenGetSubscriptionBillingPortal();
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
        {isCancelled && (
          <Button
            data-testid="shield-detail-renew-button"
            variant={ButtonVariant.Secondary}
            className="w-full"
            onClick={() => {
              handlePaymentError();
            }}
          >
            {t('shieldTxMembershipRenew')}
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
    </Box>
  );
};

export default ManageShieldPlan;
