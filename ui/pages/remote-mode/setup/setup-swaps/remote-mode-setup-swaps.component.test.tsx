import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import RemoteModeSetupSwaps from './remote-mode-setup-swaps.component';

const renderComponent = () => {
  const store = configureMockStore([])({
    metamask: {
      isRemoteModeEnabled: true,
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
