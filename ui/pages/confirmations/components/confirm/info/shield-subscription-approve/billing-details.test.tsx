import React from 'react';
import { render } from '@testing-library/react';
import {
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { getShortDateFormatterV2 } from '../../../../../asset/util';
import BillingDetails from './billing-details';

describe('BillingDetails', () => {
  const mockProductPrice: ProductPrice = {
    interval: RECURRING_INTERVALS.year,
    minBillingCycles: 1,
    unitAmount: 80000000,
    unitDecimals: 6,
    currency: 'usd',
    trialPeriodDays: 7,
  };

  it('should render', () => {
    const { getByTestId } = render(
      <BillingDetails
        productPrice={mockProductPrice}
        isTrialSubscription={true}
      />,
    );
    expect(
      getByTestId('shield-subscription-billing_date_label'),
    ).toBeInTheDocument();
    expect(getByTestId('shield-subscription-billing_date')).toBeInTheDocument();
  });

  it('should render the correct billing date for a non-trial subscription', () => {
    const { getByTestId } = render(
      <BillingDetails
        productPrice={mockProductPrice}
        isTrialSubscription={false}
      />,
    );

    const expectedBillingDate = getShortDateFormatterV2().format(new Date());
    expect(getByTestId('shield-subscription-billing_date')).toHaveTextContent(
      expectedBillingDate,
    );
  });
});
