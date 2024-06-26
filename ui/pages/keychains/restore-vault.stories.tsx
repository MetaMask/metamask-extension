import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import RestoreVaultPage from './restore-vault';
import { createNewVaultAndRestore, unMarkPasswordForgotten } from '../../store/actions';

const mockReducer = (state = { isLoading: false }, action) => {
  switch (action.type) {
    case 'CREATE_NEW_VAULT_AND_RESTORE':
      return { ...state, isLoading: true };
    case 'UNMARK_PASSWORD_FORGOTTEN':
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

const store = createStore(mockReducer);

const meta: Meta<typeof RestoreVaultPage> = {
  title: 'Pages/Keychains/RestoreVaultPage',
  component: RestoreVaultPage,
  parameters: {
    docs: {
      page: null,
    },
  },
  decorators: [(Story) => <Provider store={store}><Story /></Provider>],
  argTypes: {
    history: { control: 'object' },
  },
  args: {
    history: { push: () => {} },
  },
};

export default meta;
type Story = StoryObj<typeof RestoreVaultPage>;

export const DefaultStory: Story = {
  render: (args) => <RestoreVaultPage {...args} isLoading={false} />,
};

DefaultStory.storyName = 'Default';
