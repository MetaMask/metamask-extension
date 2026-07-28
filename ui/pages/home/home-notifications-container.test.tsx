import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setActiveNetwork, setNewNetworkAdded } from '../../store/actions';
import {
  HomeNotificationsContainer,
  resetActivatedNewNetworkConfigurationIdsForTesting,
} from './home-notifications-container';

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../selectors', () => ({
  activeTabHasPermissions: () => false,
  getOriginOfCurrentTab: () => null,
  getNewNetworkAdded: () => '',
  getEditedNetwork: () => undefined,
  getShowOutdatedBrowserWarning: () => false,
  getWeb3ShimUsageStateForOrigin: () => null,
}));

jest.mock('../../../shared/lib/selectors/networks', () => ({
  getInfuraBlocked: () => false,
}));

jest.mock('../../ducks/metamask/metamask', () => ({
  getIsPrimarySeedPhraseBackedUp: () => true,
  getWeb3ShimUsageAlertEnabledness: () => false,
}));

jest.mock('../../../shared/lib/selectors/accounts', () => {
  // Stable reference — react-redux warns if a selector returns a new object each call.
  const mockSelectedInternalAccount = { address: '0x1' };
  return {
    getSelectedInternalAccount: () => mockSelectedInternalAccount,
  };
});

jest.mock('../../selectors/multi-srp/multi-srp', () => ({
  getShouldShowSeedPhraseReminder: () => false,
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  setActiveNetwork: jest.fn((configurationId: string) => ({
    type: 'SET_ACTIVE_NETWORK',
    payload: configurationId,
  })),
  setNewNetworkAdded: jest.fn(() => ({
    type: 'SET_NEW_NETWORK_ADDED',
  })),
}));

const mockStore = configureMockStore([thunk]);

function buildState(newNetworkAddedConfigurationId = '') {
  return {
    appState: {
      newNetworkAddedConfigurationId,
      newNetworkAddedName: '',
    },
    metamask: {},
  };
}

describe('HomeNotificationsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetActivatedNewNetworkConfigurationIdsForTesting();
  });

  it('activates a newly added network only once across remounts', () => {
    const store = mockStore(buildState('network-config-1'));

    const { unmount } = render(
      <Provider store={store}>
        <HomeNotificationsContainer />
      </Provider>,
    );

    expect(setActiveNetwork).toHaveBeenCalledTimes(1);
    expect(setActiveNetwork).toHaveBeenCalledWith('network-config-1');
    expect(setNewNetworkAdded).toHaveBeenCalled();

    unmount();

    render(
      <Provider store={store}>
        <HomeNotificationsContainer />
      </Provider>,
    );

    expect(setActiveNetwork).toHaveBeenCalledTimes(1);
    expect(setNewNetworkAdded).toHaveBeenCalledTimes(2);
  });

  it('reactivates the same network after the pending add was cleared', () => {
    render(
      <Provider store={mockStore(buildState('network-config-1'))}>
        <HomeNotificationsContainer />
      </Provider>,
    );

    expect(setActiveNetwork).toHaveBeenCalledTimes(1);

    const { unmount: unmountClearedState } = render(
      <Provider store={mockStore(buildState(''))}>
        <HomeNotificationsContainer />
      </Provider>,
    );
    unmountClearedState();

    render(
      <Provider store={mockStore(buildState('network-config-1'))}>
        <HomeNotificationsContainer />
      </Provider>,
    );

    expect(setActiveNetwork).toHaveBeenCalledTimes(2);
    expect(setActiveNetwork).toHaveBeenLastCalledWith('network-config-1');
  });
});
