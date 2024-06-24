import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { within, fireEvent } from '@storybook/testing-library';
import AddNetworkModal from './index';
import { useSafeChainsListValidationSelector } from '../../../selectors';

const storeMock = configureStore({
  reducer: {
    // Mock reducers here
    networks: (state = {}, action) => state, // Mock networks reducer
    metamask: (state = {}, action) => state, // Mock metamask reducer
  },
  preloadedState: {
    networks: {
      safeChainsList: [
        {
          chainId: 1,
          nativeCurrency: { symbol: 'ETH' },
        },
        {
          chainId: 56,
          nativeCurrency: { symbol: 'BNB' },
        },
      ],
    },
    metamask: {
      useSafeChainsListValidation: true, // Mock state for useSafeChainsListValidationSelector
    },
  },
});

const meta: Meta<typeof AddNetworkModal> = {
  title: 'Components/OnboardingFlow/AddNetworkModal',
  component: AddNetworkModal as React.ComponentType<{
    showHeader?: boolean;
    isNewNetworkFlow?: boolean;
    addNewNetwork?: boolean;
    networkToEdit?: null;
  }>,
  decorators: [
    (Story) => (
      <Provider store={storeMock}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    showHeader: { control: 'boolean' },
    isNewNetworkFlow: { control: 'boolean' },
    addNewNetwork: { control: 'boolean' },
    networkToEdit: { control: 'object' },
  },
  args: {
    showHeader: false,
    isNewNetworkFlow: false,
    addNewNetwork: true,
    networkToEdit: null,
  },
};

export default meta;
type Story = StoryObj<typeof AddNetworkModal>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

export const OpenModal: Story = {
  args: {
    showHeader: true,
    isNewNetworkFlow: true,
    addNewNetwork: true,
    networkToEdit: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole('button', { name: 'Open Modal' }));
  },
};
