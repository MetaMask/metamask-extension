// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';

const renderComponent = () => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isRemoteModeEnabled: true,
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
