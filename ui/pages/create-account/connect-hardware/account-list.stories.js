import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';

import AccountList from './account-list';

const store = configureStore(testData);

export default {
  title: 'Account List',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};
global.platform = {
  openTab: () => action('Open Tab')(),
};

export const AccountListComponent = () => {
  const [selectedAccounts, setSelectedAccounts] = useState([
    {
      name: 'This is a Really Long Account Name',
      address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      index: 0,
      balance: '0x176e5b6f173ebe66',
    },
  ]);
  const { metamask } = store.getState();
  const { accountArray, connectedAccounts } = metamask;
  const LEDGER_LIVE_PATH = `m/44'/60'/0'/0/0`;
  const MEW_PATH = `m/44'/60'/0'`;
  const BIP44_PATH = `m/44'/60'/0'/0`;

  const HD_PATHS = [
    { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
    { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
    { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
  ];

  const onAccountChange = (account) => {
    let accounts = [];
    if (selectedAccounts.includes(account)) {
      accounts = selectedAccounts.filter((acc) => account !== acc);
    } else {
      accounts.push(account);
    }
    setSelectedAccounts(accounts);
  };

  return (
    <AccountList
      onPathChange={() => undefined}
      selectedPath="/"
      device="null"
      accounts={accountArray}
      connectedAccounts={connectedAccounts}
      onAccountChange={onAccountChange}
      onForgetDevice={() => action('On Forget Device')()}
      getPage={() => action('Get Page')()}
      selectedAccounts={selectedAccounts}
      hdPaths={HD_PATHS}
      onCancel={() => action('On Cancel')()}
      onUnlockAccounts={() => action('On Unlock Accounts')()}
      onAccountRestriction={() => action('On Account Restriction')()}
    />
  );
};
