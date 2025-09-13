import React from 'react';
import { StoryFn } from '@storybook/react';
import { DestinationAccountPickerModal } from './destination-account-picker-modal';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Provider } from 'react-redux';
import { createBridgeMockStore } from '../../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../../store/store';
import { getAddress } from 'ethers/lib/utils';
import { DestinationAccount } from '../types';

export default {
  title: 'Pages/Bridge/DestinationAccountPickerModal',
  component: DestinationAccountPickerModal,
};

const mockAccounts = [
  createMockInternalAccount({
    name: 'EVM Account 1',
    keyringType: 'HD Key Tree',
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7c2',
  }),
  createMockInternalAccount({
    name: 'Solana Account 1',
    keyringType: 'Solana',
  }),
  createMockInternalAccount({
    name: 'EVM Account 2',
    keyringType: 'HD Key Tree',
  }),
  createMockInternalAccount({
    name: 'Solana Account 2',
    keyringType: 'Solana',
  }),
] as InternalAccount[];

const Template: StoryFn<typeof DestinationAccountPickerModal> = (args) => (
  <Provider
    store={configureStore(
      createBridgeMockStore({
        stateOverrides: {
          DNS: {
            resolutions: [
              {
                resolvedAddress: getAddress(
                  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7c1',
                ),
              },
            ],
          },
        },
      }),
    )}
  >
    <DestinationAccountPickerModal
      selectedAccount={mockAccounts[0] as DestinationAccount}
      isOpen={true}
      onClose={() => {}}
      onAccountSelect={(account) => console.log('Selected:', account)}
    />
  </Provider>
);

Template.decorators = [
  (Story) => {
    return Story();
  },
];

export const WithSelectedAccount = Template.bind({});
