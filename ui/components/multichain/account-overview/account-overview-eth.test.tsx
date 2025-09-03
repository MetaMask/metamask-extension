import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  AccountOverviewEth,
  AccountOverviewEthProps,
} from './account-overview-eth';

jest.mock('../../../store/actions', () => ({
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
  setTokenNetworkFilter: jest.fn(),
  updateSlides: jest.fn(),
  removeSlide: jest.fn(),
  addImportedTokens: jest.fn(),
}));

// Mock the dispatch function
const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

const render = (props: AccountOverviewEthProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: { assetsDefiPositionsEnabled: true }, // this to be removed when the feature flag is removed
      preferences: {
        ...mockState.metamask.preferences,
        tokenNetworkFilter: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
        },
      },
    },
  });

  return renderWithProvider(<AccountOverviewEth {...props} />, store);
};

describe('AccountOverviewEth', () => {
  beforeEach(() => {
    setBackgroundConnection({
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
    expect(queryByTestId('account-overview__defi-tab')).toBeInTheDocument();
  });
});
