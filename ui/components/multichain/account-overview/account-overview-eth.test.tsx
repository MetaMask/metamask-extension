import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  AccountOverviewEth,
  AccountOverviewEthProps,
} from './account-overview-eth';

jest.mock('../../../store/actions', () => ({
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
}));

const render = (props: AccountOverviewEthProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        tokenNetworkFilter: { [CHAIN_IDS.MAINNET]: true },
      },
    },
  });

  return renderWithProvider(<AccountOverviewEth {...props} />, store);
};

describe('AccountOverviewEth', () => {
  beforeEach(() => {
    setBackgroundConnection({
      setBridgeFeatureFlags: jest.fn(),
      tokenBalancesStartPolling: jest.fn(),
    } as never);
  });
  it('shows all tabs', () => {
    const { queryByTestId } = render({
      defaultHomeActiveTabName: null,
      onTabClick: jest.fn(),
      setBasicFunctionalityModalOpen: jest.fn(),
      onSupportLinkClick: jest.fn(),
    });

    expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
    expect(queryByTestId('account-overview__nfts-tab')).toBeInTheDocument();
    expect(queryByTestId('account-overview__activity-tab')).toBeInTheDocument();
  });
});
