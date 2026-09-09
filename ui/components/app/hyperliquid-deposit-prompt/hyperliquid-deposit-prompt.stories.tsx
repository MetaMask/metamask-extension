import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { HyperliquidDepositPrompt } from './hyperliquid-deposit-prompt';

const store = configureStore(mockState);

const meta = {
  title: 'Components/App/HyperliquidDepositPrompt',
  component: HyperliquidDepositPrompt,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <div style={{ width: 360, height: 640, padding: 16 }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
} satisfies Meta<typeof HyperliquidDepositPrompt>;

export default meta;
type Story = StoryObj<typeof HyperliquidDepositPrompt>;

export const DefaultStory: Story = {
  name: 'Default',
  args: {
    onActionComplete: () => undefined,
    selectedAddress: undefined,
  },
};
