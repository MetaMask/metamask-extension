import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import UnlockPage from './unlock-page';

type Story = StoryObj<typeof UnlockPage>;

// Mock Redux store for Storybook
const createMockStore = (isUnlocked = false) => {
  return configureStore({
    reducer: {
      metamask: () => ({
        isUnlocked,
      }),
    },
  });
};

const meta: Meta<typeof UnlockPage> = {
  title: 'Pages/UnlockPage',
  component: UnlockPage,
  argTypes: {
    onSubmit: {
      action: 'onSubmit',
      description: 'Custom onSubmit handler when form is submitted',
    },
  },
  decorators: [
    (Story, { args }) => {
      const store = createMockStore(false);

      return (
        <Provider store={store}>
          <MemoryRouter>
            <Story {...args} />
          </MemoryRouter>
        </Provider>
      );
    },
  ],
};

export default meta;

export const Default: Story = {
  args: {},
};

export const WithCustomSubmit: Story = {
  args: {
    onSubmit: async (password: string) => {
      console.log('Custom onSubmit called with password:', password);
      return Promise.resolve();
    },
  },
};

export const WithSubmitError: Story = {
  args: {
    onSubmit: async (password: string) => {
      console.log('onSubmit called with password:', password);
      // Simulate an error
      throw new Error('Incorrect password');
    },
  },
};

export const WithSlowSubmit: Story = {
  args: {
    onSubmit: async (password: string) => {
      console.log('onSubmit called with password:', password);
      // Simulate a slow network request
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return Promise.resolve();
    },
  },
};