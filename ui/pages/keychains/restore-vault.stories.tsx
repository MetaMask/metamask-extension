import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { within, userEvent } from '@storybook/testing-library';
import RestoreVaultPage from './restore-vault';
import { createNewVaultAndRestore, unMarkPasswordForgotten } from '../../store/actions';

const mockSlice = createSlice({
  name: 'mock',
  initialState: { appState: { isLoading: false } },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase('CREATE_NEW_VAULT_AND_RESTORE', (state) => {
        state.appState.isLoading = true;
      })
      .addCase('UNMARK_PASSWORD_FORGOTTEN', (state) => {
        state.appState.isLoading = false;
      });
  },
});

const store = configureStore({
  reducer: mockSlice.reducer,
});

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
