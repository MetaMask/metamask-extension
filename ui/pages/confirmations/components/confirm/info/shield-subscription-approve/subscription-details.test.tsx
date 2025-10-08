import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { tEn } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { SubscriptionDetails } from './subscription-details';

describe('SubscriptionDetails', () => {
  it('renders annual plan with trial correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(
      <SubscriptionDetails approvalAmount={'80'} showTrial={true} />,
      mockStore,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
    expect(getByText('$80/year (Annual)' as string)).toBeInTheDocument();
    expect(getByText(tEn('freeSevenDayTrial') as string)).toBeInTheDocument();
  });

  it('renders monthly plan without trial correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithProvider(
      <SubscriptionDetails approvalAmount={'96'} showTrial={false} />,
      mockStore,
    );

    expect(getByText(tEn('transactionShield') as string)).toBeInTheDocument();
    expect(getByText('$8/month (Monthly)' as string)).toBeInTheDocument();
  });
});
