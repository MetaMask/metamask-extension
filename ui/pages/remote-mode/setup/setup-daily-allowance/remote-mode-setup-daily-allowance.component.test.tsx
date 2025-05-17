import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';

const renderComponent = () => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isRemoteModeEnabled: true,
      delegations: {},
      selectedNetworkClientId: 'sepolia',
    },
  });
  return renderWithProvider(<RemoteModeSetupDailyAllowance />, store);
};

describe('RemoteModeSetupDailyAllowance Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
