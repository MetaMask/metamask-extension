import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import RemoteModeSetupSwaps from './remote-mode-setup-swaps.component';

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
  return renderWithProvider(<RemoteModeSetupSwaps />, store);
};

describe('RemoteModeSetupSwaps Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
