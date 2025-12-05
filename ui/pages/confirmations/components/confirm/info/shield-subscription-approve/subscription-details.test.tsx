import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { tEn } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { SubscriptionDetails } from './subscription-details';

const mockProductPrice: ProductPrice = {
  interval: RECURRING_INTERVALS.year,
  minBillingCycles: 1,
  unitAmount: 80000000,
  unitDecimals: 6,
  currency: 'usd',
  trialPeriodDays: 14,
  minBillingCyclesForBalance: 1,
};

describe('SubscriptionDetails', () => {
  it('renders annual plan with trial correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(
      <SubscriptionDetails productPrice={mockProductPrice} showTrial={true} />,
      mockStore,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
    expect(getByText('$80/year (Annual)' as string)).toBeInTheDocument();
    expect(getByText(tEn('freeTrialDays', [14]) as string)).toBeInTheDocument();
  });

  it('renders monthly plan without trial correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const monthProductPrice: ProductPrice = {
      ...mockProductPrice,
      interval: RECURRING_INTERVALS.month,
      unitAmount: 8000000,
    };
    const { getByText } = renderWithProvider(
      <SubscriptionDetails
        productPrice={monthProductPrice}
        showTrial={false}
      />,
      mockStore,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
    expect(getByText('$8/month (Monthly)' as string)).toBeInTheDocument();
  });
});
