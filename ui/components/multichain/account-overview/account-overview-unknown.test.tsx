import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import {
  AccountOverviewUnknown,
  AccountOverviewUnknownProps,
} from './account-overview-unknown';

const render = (props: AccountOverviewUnknownProps) => {
  const store = configureStore({
    metamask: mockState.metamask,
  });

  return renderWithProvider(
    <AccountOverviewUnknown {...props} />,
    store,
    undefined,
    undefined,
    undefined,
    undefined,
    createMockRouteMessenger(),
  );
};

describe('AccountOverviewUnknown', () => {
  it('shows only the activity tab', () => {
    const { queryByTestId } = render({
      setBasicFunctionalityModalOpen: jest.fn(),
      onSupportLinkClick: jest.fn(),
    });

    expect(
      queryByTestId('account-overview__asset-tab'),
    ).not.toBeInTheDocument();
    expect(queryByTestId('account-overview__nfts-tab')).not.toBeInTheDocument();
    expect(queryByTestId('account-overview__activity-tab')).toBeInTheDocument();
    expect(queryByTestId('account-overview__defi-tab')).not.toBeInTheDocument();
  });
});
