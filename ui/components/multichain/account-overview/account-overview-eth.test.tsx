import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import {
  AccountOverviewEth,
  AccountOverviewEthProps,
} from './account-overview-eth';

const render = (props: AccountOverviewEthProps) => {
  const store = configureStore({
    metamask: mockState.metamask,
  });

  return renderWithProvider(<AccountOverviewEth {...props} />, store);
};

describe('AccountOverviewEth', () => {
  it('shows all tabs', () => {
    const { queryByTestId } = render({
      defaultHomeActiveTabName: '',
      onTabClick: jest.fn(),
      setBasicFunctionalityModalOpen: jest.fn(),
      onSupportLinkClick: jest.fn(),
    });

    expect(queryByTestId('home__asset-tab')).toBeInTheDocument();
    expect(queryByTestId('home__nfts-tab')).toBeInTheDocument();
    expect(queryByTestId('home__activity-tab')).toBeInTheDocument();
  });
});
