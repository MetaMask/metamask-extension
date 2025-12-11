import React, { useMemo } from 'react';
import { Button, ButtonVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSubscriptionProductPlans } from '../../../../hooks/subscription/useSubscriptionPricing';
import {
  PricingResponse,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { getProductPrice } from '../../../shield-plan/utils';

const ReactivateButton = ({
  subscriptionPricing,
  handlePaymentError,
}: {
  subscriptionPricing?: PricingResponse;
  handlePaymentError: () => void;
}) => {
  const t = useI18nContext();
  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );

  const priceDetails = useMemo(() => {
    const monthlyPlan = pricingPlans?.find(
      (plan) => plan.interval === RECURRING_INTERVALS.month,
    );
    if (!monthlyPlan) {
      return '';
    }
    return t('shieldPlanMonthlyPrice', [`$${getProductPrice(monthlyPlan)}`]);
  }, [pricingPlans]);


  return (
    <Button
      data-testid="shield-detail-renew-button"
      className="w-full"
      variant={ButtonVariant.Secondary}
      onClick={() => {
        handlePaymentError();
      }}
    >
      {t('shieldTxMembershipRenewDescription', [priceDetails])}
    </Button>
  );
};

export default ReactivateButton;
