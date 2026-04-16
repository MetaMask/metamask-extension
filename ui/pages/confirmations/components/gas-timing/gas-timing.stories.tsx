import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import GasTiming from './gas-timing.component';
import mockState from '../../../../../test/data/mock-state.json';
import { GAS_FORM_ERRORS } from '../../../../helpers/constants/gas';

const storeMock = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const meta: Meta<typeof GasTiming> = {
  title: 'Pages/Confirmations/Components/GasTiming',
  component: GasTiming as React.ComponentType<{
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
    gasWarnings: any;
  }>,
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
    maxFeePerGas: '0',
    maxPriorityFeePerGas: '0',
    gasWarnings: {},
  },
};

export default meta;
type Story = StoryObj<typeof GasTiming>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

export const GasTooLowStory: Story = {
  args: {
    maxFeePerGas: '1', // Simulate low gas fee
    maxPriorityFeePerGas: '1', // Simulate low priority fee
    gasWarnings: {
      maxPriorityFee: GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW,
      maxFee: GAS_FORM_ERRORS.MAX_FEE_TOO_LOW,
    },
  },
};

GasTooLowStory.storyName = 'GasTooLow';
