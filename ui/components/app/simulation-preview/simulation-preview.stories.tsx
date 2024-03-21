import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { SimulationPreview } from './simulation-preview';
import mockState from '../../../../test/data/mock-state.json';

const storeMock = configureStore({
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      useNativeCurrencyAsPrimaryCurrency: false,
    },
  },
});

const meta: Meta<typeof SimulationPreview> = {
  title: 'Components/App/SimulationPreview',
  component: SimulationPreview,
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
};

export default meta;
type Story = StoryObj<typeof SimulationPreview>;

export const PositiveNativeChange: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: {
        previousBalance: '0x2',
        newBalance: '0x1',
        difference: '0x12345678912345678',
        isDecrease: false,
      },
      tokenBalanceChanges: [],
    },
  },
};

export const NegativeNativeChange: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: {
        previousBalance: '0x1',
        newBalance: '0x2',
        difference: '0x12345678912345678',
        isDecrease: true,
      },
      tokenBalanceChanges: [],
    },
  },
};

export const NoBalanceChanges: Story = {
  args: {
    simulationData: {
      nativeBalanceChange: undefined,
      tokenBalanceChanges: [],
    },
  },
};

export const SimulationFailed: Story = {
  args: {},
}
