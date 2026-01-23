import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../store/store';
import testData from '../../../.storybook/test-data';
import RemoveSnapAccount from './remove-snap-account';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { KeyringType } from '../../../shared/constants/keyring';
import { AccountWalletType, toMultichainAccountGroupId, toMultichainAccountWalletId } from '@metamask/account-api';

const mockSnap = {
  id: 'npm:@metamask/test-snap',
  name: 'Test Snap',
};

const mockSnapAccount = createMockInternalAccount({
  name: 'Snap Account 1',
  address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
  keyringType: KeyringType.snap,
  snapOptions: {
    enabled: true,
    ...mockSnap,
  },
});

const mockWalletId = toMultichainAccountWalletId('wallet-1');
const mockGroupId = toMultichainAccountGroupId(mockWalletId, 0);
const mockAccountTree = {
  wallets: {
    [mockWalletId]: {
      id: mockWalletId,
      type: AccountWalletType.Entropy,
      metadata: {
        name: 'Test Wallet',
      },
      groups: {
        [mockGroupId]: {
          id: mockGroupId,
          metadata: {
            name: 'Test Snap Account',
          },
          accounts: [mockSnapAccount.id],
        },
      },
    },
  },
  selectedAccountGroup: mockGroupId,
};

const mockDefaultState = {
  ...testData,
  metamask: {
    ...testData.metamask,
    internalAccounts: {
      selectedAccount: mockSnapAccount.id,
      accounts: {
        [mockSnapAccount.id]: mockSnapAccount,
      },
    },
    accountTree: mockAccountTree,
    accountGroupsMetadata: {
      [mockGroupId]: {
        name: 'My Awesome Snap Account',
      },
    },
    keyrings: [
      {
        type: KeyringType.snap,
        accounts: [mockSnapAccount.address],
        metadata: {
          id: 'test-keyring-id',
          name: 'Test Snap Keyring',
        },
      },
    ],
    snapsMetadata: {
      [mockSnap.id]: {
        name: mockSnap.name,
        iconUrl: './images/logo/metamask-fox.svg',
      },
    },
    preferences: {
      privacyMode: false,
    },
    currentCurrency: 'usd',
  },
};

const store = configureStore(mockDefaultState);

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/UI/RemoveSnapAccount', // title should follow the folder structure location of the component. Don't use spaces.
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => (
  <RemoveSnapAccount
    snapId={mockSnap.id}
    snapName={mockSnap.name}
    publicAddress={mockSnapAccount.address}
    onCancel={() => {}}
  />
);

DefaultStory.storyName = 'Default';
