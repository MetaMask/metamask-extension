import React, { useMemo } from 'react';
import { ProductPrice } from '@metamask/subscription-controller';
import { DateTime } from 'luxon';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

const BillingDetails = ({
  productPrice,
  isTrialSubscription,
}: {
  productPrice: ProductPrice;
  isTrialSubscription: boolean;
}) => {
  const t = useI18nContext();
  const billingDate = useMemo(() => {
    // If it's not a trial subscription, return the billing date as today
    if (!isTrialSubscription) {
      return DateTime.now().toFormat('MMMM d, y');
    }
    const { trialPeriodDays } = productPrice;
    const trialEndDate = DateTime.now().plus({ days: trialPeriodDays });

    return trialEndDate.toFormat('MMMM d, y');
  }, [productPrice, isTrialSubscription]);

  return (
    <ConfirmInfoSection data-testid="shield-subscription-billing_details_section">
      <ConfirmInfoRow
        label={t('shieldPlanBillingDate')}
        style={{ color: 'var(--color-text-alternative)' }}
      >
        <ConfirmInfoRowText
          text={billingDate}
          data-testid="shield-subscription-billing_date"
        />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export default BillingDetails;
