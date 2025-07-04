import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import {
  AccountOverviewUnknown,
  AccountOverviewUnknownProps,
} from './account-overview-unknown';

const render = (props: AccountOverviewUnknownProps) => {
  const store = configureStore({
    metamask: mockState.metamask,
  });

  return renderWithProvider(
    <MemoryRouter>
      <CompatRouter>
        <AccountOverviewUnknown {...props} />
      </CompatRouter>
    </MemoryRouter>,
    store,
  );
};

describe('AccountOverviewUnknown', () => {
  it('shows only the activity tab', () => {
    const { queryByTestId } = render({
      defaultHomeActiveTabName: null,
      onTabClick: jest.fn(),
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
