import React, { useMemo } from 'react';
import { ConfirmInfoRow, ConfirmInfoRowText } from "../../../../../../components/app/confirm/info/row";
import { ConfirmInfoSection } from "../../../../../../components/app/confirm/info/row/section";
import { ProductPrice } from '@metamask/subscription-controller';
import { DateTime } from 'luxon';

const BillingDetails = ({ productPrice }: { productPrice: ProductPrice }) => {
  const billingDate = useMemo(() => {
    const { trialPeriodDays } = productPrice;
    const trialEndDate = DateTime.now().plus({ days: trialPeriodDays });

    return trialEndDate.toFormat('MMMM d, y');
  }, [productPrice]);

  return (
    <ConfirmInfoSection data-testid="shield-subscription-billing_details_section">
      <ConfirmInfoRow
        label="Billing Date"
        style={{ color: 'var(--color-text-alternative)' }}
      >
        <ConfirmInfoRowText text={billingDate} data-testid="shield-subscription-billing_date" />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
}

export default BillingDetails;
