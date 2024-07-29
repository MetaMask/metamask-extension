import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import GasTiming from './gas-timing.component';
import mockState from '../../../../../test/data/mock-state.json';

const storeMock = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const meta: Meta<typeof GasTiming> = {
  title: 'Pages/Confirmations/Components/GasTiming',
  component: GasTiming as React.ComponentType<{ maxFeePerGas?: number; maxPriorityFeePerGas?: number; gasWarnings: any }>,
  decorators: [
    (StoryComponent: React.FC) => (
      <Provider store={storeMock}>
        <StoryComponent />
      </Provider>
    ),
  ],
  argTypes: {
    maxFeePerGas: {
      control: 'string',
    },
    maxPriorityFeePerGas: {
      control: 'string',
    },
    gasWarnings: {
      control: 'object',
    },
  },
  args: {
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0,
    gasWarnings: {},
  },
};

export default meta;
type Story = StoryObj<typeof GasTiming>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';
