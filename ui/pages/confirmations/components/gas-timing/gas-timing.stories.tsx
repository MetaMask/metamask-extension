import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { storeMock } from '../../../../__mocks__/storeMock';
import GasTiming from './gas-timing.component';

const meta: Meta<typeof GasTiming> = {
  title: 'Components/Confirmations/GasTiming',
  component: GasTiming,
  decorators: [
    (StoryComponent: React.FC) => (
      <Provider store={storeMock}>
        <StoryComponent />
      </Provider>
    ),
  ],
  argTypes: {
    maxFeePerGas: {
      control: 'number',
    },
    maxPriorityFeePerGas: {
      control: 'number',
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
