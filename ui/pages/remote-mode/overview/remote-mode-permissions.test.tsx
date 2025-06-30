import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import RemoteModePermissions from './remote-mode-permissions.component';

type RemoteModePermissionsProps = {
  setStartEnableRemoteSwap?: (startEnableRemoteSwap: boolean) => void;
  setStartEnableDailyAllowance?: (startEnableDailyAllowance: boolean) => void;
};

const defaultProps: RemoteModePermissionsProps = {
  setStartEnableRemoteSwap: () => undefined,
  setStartEnableDailyAllowance: () => undefined,
};

const renderComponent = (props: RemoteModePermissionsProps = defaultProps) => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      delegations: {},
      selectedNetworkClientId: 'sepolia',
    },
  });
  return renderWithProvider(<RemoteModePermissions {...props} />, store);
};

describe('RemoteModePermissions Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent(defaultProps);
    }).not.toThrow();
  });
});
