import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { within, userEvent } from '@storybook/testing-library';
import RestoreVaultPage from './restore-vault';
import { createNewVaultAndRestore, unMarkPasswordForgotten } from '../../store/actions';

const mockReducer = (state = { appState: { isLoading: false } }, action) => {
  switch (action.type) {
    case 'CREATE_NEW_VAULT_AND_RESTORE':
      return { ...state, appState: { isLoading: true } };
    case 'UNMARK_PASSWORD_FORGOTTEN':
      return { ...state, appState: { isLoading: false } };
    default:
      return state;
  }
};

const store = createStore(mockReducer);

const meta: Meta<typeof RestoreVaultPage> = {
  title: 'pages-keychains-restorevaultpage',
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
  render: (args) => <RestoreVaultPage {...args} />,
};

DefaultStory.storyName = 'Default';

export const SubmitForm: Story = {
  render: (args) => <RestoreVaultPage {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    await userEvent.type(canvas.getByLabelText('Seed Phrase'), 'seed phrase example');
    await userEvent.click(canvas.getByRole('button', { name: 'Restore' }));
  },
};

SubmitForm.storyName = 'Submit Form';
