import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import ShieldSubscriptionApproveLoader from './shield-subscription-approve-loader';

describe('ShieldSubscriptionApproveLoader', () => {
  it('renders correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <ShieldSubscriptionApproveLoader />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
