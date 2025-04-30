import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import SmartAccountUpdateInformation from './smart-account-update-information.component';

const renderComponent = () => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isRemoteModeEnabled: true,
    },
  });
  return renderWithProvider(
    <SmartAccountUpdateInformation
      selectedHardwareAccount={{
        ...mockState.metamask.internalAccounts.accounts[
          '07c2cfec-36c9-46c4-8115-3836d3ac9047'
        ],
        type: 'eip155:eoa',
        scopes: ['eip155:1'],
      }}
    />,
    store,
  );
};

describe('RemoteModeSetupSwaps Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
