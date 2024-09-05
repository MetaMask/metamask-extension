import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockState from '../../../../test/data/mock-state.json';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import { getMockPersonalSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { SignatureRequestType } from '../../../pages/confirmations/types/confirm';
import { ConfirmContextProvider } from '../../../pages/confirmations/context/confirm';
import { MMISignatureMismatchBanner } from './';

const mockStore = configureMockStore();

const selectedAccount = {
  address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
  id: '7ae06c6d-114a-4319-bf75-9fa3efa2c8b9',
  metadata: {
    name: 'Account 1',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [...Object.values(EthMethod)],
  type: EthAccountType.Eoa,
};

const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const internalAccounts = {
  accounts: {
    ...mockState.metamask.internalAccounts.accounts,
    [selectedAccount.id]: selectedAccount,
  },
  selectedAccount: selectedAccount.id,
};

const createStore = (chainId) => {
  const initialState = getMockPersonalSignConfirmStateForRequest(
    {
      ...unapprovedPersonalSignMsg,
      msgParams: { ...unapprovedPersonalSignMsg.msgParams, from: address },
    } as SignatureRequestType,
    {
      metamask: {
        internalAccounts,
      },
    },
  );

  return mockStore(initialState);
};

const meta: Meta<typeof MMISignatureMismatchBanner> = {
  title: 'Components/Institutional/MMISignatureMismatchBanner',
  decorators: [
    (storyFn) => (
      <Provider store={createStore(CHAIN_IDS.MAINNET)}>
        <ConfirmContextProvider>{storyFn()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
  component: MMISignatureMismatchBanner,
  argTypes: {},
};

export default meta;

const Template: StoryFn<typeof MMISignatureMismatchBanner> = (args) => (
  <MMISignatureMismatchBanner {...args} />
);

export const Default = Template.bind({});
Default.args = {};
