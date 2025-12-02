import React, { useCallback, useState } from 'react';
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
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import {
  EntryModalSourceEnum,
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
  ShieldUnexpectedErrorEventLocationEnum,
} from '../../../../../shared/constants/subscriptions';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { useSubscriptionMetrics } from '../../../../hooks/shield/metrics/useSubscriptionMetrics';
import { SHIELD_PLAN_ROUTE } from '../../../../helpers/constants/routes';
import { getIsShieldSubscriptionPaused } from '../../../../../shared/lib/shield';
import { getShortDateFormatterV2 } from '../../../asset/util';

const ManageShieldPlan = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { captureShieldErrorStateClickedEvent } = useSubscriptionMetrics();

  const { subscriptions, lastSubscription } = useUserSubscriptions();
  const currentShieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const lastShieldSubscription = useUserLastSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    lastSubscription,
  );
  // show current active shield subscription or last subscription if no active subscription
  const displayedShieldSubscription =
    currentShieldSubscription ?? lastShieldSubscription;
  const isCancelled =
    displayedShieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const isPaused = getIsShieldSubscriptionPaused(subscriptions);
  const isMembershipInactive = isCancelled || isPaused;
  // user can cancel subscription if not canceled and current subscription not cancel at period end
  const canCancel =
    !isCancelled && !currentShieldSubscription?.cancelAtPeriodEnd;

  const [executeCancelSubscription, cancelSubscriptionResult] =
    useCancelSubscription(currentShieldSubscription);

  const [executeUnCancelSubscription, unCancelSubscriptionResult] =
    useUnCancelSubscription(currentShieldSubscription);

  const [
    executeOpenGetSubscriptionBillingPortal,
    openGetSubscriptionBillingPortalResult,
  ] = useOpenGetSubscriptionBillingPortal(displayedShieldSubscription);

  const hasApiError =
    cancelSubscriptionResult.error ||
    unCancelSubscriptionResult.error ||
    openGetSubscriptionBillingPortalResult.error;
  const loading =
    cancelSubscriptionResult.pending ||
    unCancelSubscriptionResult.pending ||
    openGetSubscriptionBillingPortalResult.pending;

  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);

  const handleRenewSubscription = useCallback(async () => {
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
    }
  }, [
    captureShieldErrorStateClickedEvent,
    currentShieldSubscription,
    isCancelled,
    navigate,
  ]);

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
        <Text variant={TextVariant.HeadingMd} className="px-4 mb-4">
          {t('shieldManagePlan')}
        </Text>
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
            <ButtonRow
              title={t('shieldTxDetails3Title')}
              description="Card"
              onClick={() => {
                console.log('Payment method');
              }}
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
              handleRenewSubscription();
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
