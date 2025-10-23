import React from 'react';
import { render } from '@testing-library/react';
import {
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { DateTime } from 'luxon';
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
    const { getByText, getByTestId } = render(
      <BillingDetails
        productPrice={mockProductPrice}
        isTrialSubscription={true}
      />,
    );
    expect(getByText('Billing Date')).toBeInTheDocument();
    expect(getByTestId('shield-subscription-billing_date')).toBeInTheDocument();
  });

  it('should render the correct billing date for a non-trial subscription', () => {
    const { getByTestId } = render(
      <BillingDetails
        productPrice={mockProductPrice}
        isTrialSubscription={false}
      />,
    );

    const expectedBillingDate = DateTime.now().toFormat('MMMM d, y');
    expect(getByTestId('shield-subscription-billing_date')).toHaveTextContent(
      expectedBillingDate,
    );
  });
});
