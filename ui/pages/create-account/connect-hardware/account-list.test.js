import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  HardwareDeviceNames,
  DEFAULT_HD_PATHS,
  HD_PATHS,
} from '../../../../shared/constants/hardware-wallets';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import AccountList from './account-list';

const accountId = '0x8eeee1781fd885ff5ddef7789486676961873d12';
const mockState = {
  metamask: {
    provider: { chainId: '0x5', type: 'goerli' },
    keyrings: [],
    cachedBalances: {
      '0x5': {},
    },
    accounts: {
      [accountId]: {
        address: accountId,
        balance: '0x7e64033f2fdb0436',
        index: 0,
      },
    },
    selectedAddress: accountId,
  },
  appState: {
    defaultHdPaths: DEFAULT_HD_PATHS,
  },
};

describe('Account List', () => {
  const store = configureMockStore()(mockState);

  describe('render', () => {
    it('should match snapshot', () => {
      const { [accountId]: selectedAccount } = mockState.metamask.accounts;
      // eslint-disable-next-line no-empty-function
      const noOp = () => {};
      const render = () => (
        <AccountList
          device={HardwareDeviceNames.ledger}
          hdPaths={HD_PATHS}
          accounts={[selectedAccount]}
          selectedAccounts={[selectedAccount]}
          getPage={noOp}
          onAccountChange={noOp}
          onAccountRestriction={noOp}
          onCancel={noOp}
          onForgetDevice={noOp}
          onPathChange={noOp}
          onUnlockAccounts={noOp}
        ></AccountList>
      );
      const { container } = renderWithProvider(render(), store);
      expect(container).toMatchSnapshot();
    });
  });
});
