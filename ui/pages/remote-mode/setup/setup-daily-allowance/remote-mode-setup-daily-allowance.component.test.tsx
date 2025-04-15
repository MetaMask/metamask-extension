import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';

const renderComponent = () => {
  const store = configureMockStore([])({
    metamask: {
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
