import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { DailyAllowanceTokenTypes } from '../remote.types';
import RemoteModeSetupDailyAllowance from './remote-mode-setup-daily-allowance.component';

const mockAccount = {
  address: '0x12C7e...q135f',
  type: 'eip155:eoa' as const,
  id: '1',
  options: {},
  metadata: {
    name: 'Hardware Lockbox',
    importTime: 1717334400,
    keyring: {
      type: 'eip155',
    },
  },
  scopes: [],
  methods: [],
};

const renderComponent = (props = { accounts: [mockAccount] }) => {
  const store = configureMockStore([])({
    metamask: {
      isRemoteModeEnabled: true,
    },
  });
  return renderWithProvider(
    <RemoteModeSetupDailyAllowance {...props} />,
    store,
  );
};

describe('RemoteModeSetupDailyAllowance Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
