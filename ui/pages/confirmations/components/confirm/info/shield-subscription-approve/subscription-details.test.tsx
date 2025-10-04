import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { SubscriptionDetails } from './subscription-details';

describe('SubscriptionDetails', () => {
  it('renders annual plan with trial correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <SubscriptionDetails approvalAmount={'80'} showTrial={true} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders monthly plan without trial correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <SubscriptionDetails approvalAmount={'96'} showTrial={false} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
