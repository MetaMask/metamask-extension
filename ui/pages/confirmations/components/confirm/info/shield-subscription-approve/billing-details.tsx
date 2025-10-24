import React, { useMemo } from 'react';
import { ProductPrice } from '@metamask/subscription-controller';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getShortDateFormatterV2 } from '../../../../../asset/util';

const BillingDetails = ({
  productPrice,
  isTrialSubscription,
}: {
  productPrice: ProductPrice;
  isTrialSubscription: boolean;
}) => {
  const t = useI18nContext();
  const billingDate = useMemo(() => {
    const trialEndDate = new Date();
    const { trialPeriodDays } = productPrice;

    // If it's a trial subscription, return the billing date as today plus the trial period days
    if (isTrialSubscription) {
      trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);
    }

    return getShortDateFormatterV2().format(trialEndDate);
  }, [productPrice, isTrialSubscription]);

  return (
    <ConfirmInfoSection data-testid="shield-subscription-billing_details_section">
      <ConfirmInfoRow
        label={t('shieldPlanBillingDate')}
        style={{ color: 'var(--color-text-alternative)' }}
        data-testid="shield-subscription-billing_date_label"
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
