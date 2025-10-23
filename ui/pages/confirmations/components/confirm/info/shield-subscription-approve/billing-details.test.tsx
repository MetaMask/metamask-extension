import React from "react";
import { render } from "@testing-library/react";
import BillingDetails from "./billing-details";
import { ProductPrice, RECURRING_INTERVALS } from "@metamask/subscription-controller";

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
    const { getByText, getByTestId } = render(<BillingDetails productPrice={mockProductPrice} />)
    expect(getByText('Billing Date')).toBeInTheDocument();
    expect(getByTestId('shield-subscription-billing_date')).toBeInTheDocument();
  });
});
