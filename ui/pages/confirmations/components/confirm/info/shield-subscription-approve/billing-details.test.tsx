import React from 'react';
import { render } from '@testing-library/react';
import {
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import BillingDetails from './billing-details';

describe('BillingDetails', () => {
  const mockSubscriptionDate = 'Oct 23, 2025';
  const mockProductPrice: ProductPrice = {
    interval: RECURRING_INTERVALS.year,
    minBillingCycles: 1,
    unitAmount: 80000000,
    unitDecimals: 6,
    currency: 'usd',
    trialPeriodDays: 7,
  };

  beforeAll(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date(mockSubscriptionDate));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

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
    expect(getByTestId('shield-subscription-billing_date')).toHaveTextContent(
      'Oct 30, 2025', // 7 days after the subscription date
    );
  });

  it('should render the correct billing date for a non-trial subscription', () => {
    const { getByTestId } = render(
      <BillingDetails
        productPrice={mockProductPrice}
        isTrialSubscription={false}
      />,
    );

    expect(getByTestId('shield-subscription-billing_date')).toHaveTextContent(
      'Oct 23, 2025',
    );
  });
});
