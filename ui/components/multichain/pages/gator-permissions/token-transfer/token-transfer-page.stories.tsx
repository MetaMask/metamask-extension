import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { TokenTransferPage } from './token-transfer-page';

const store = configureStore(mockState);

function StoryWrapper() {
  return (
    <Provider store={store}>
      <TokenTransferPage />
    </Provider>
  );
}

const meta: Meta<typeof TokenTransferPage> = {
  title: 'Components/Multichain/GatorPermissions/TokenTransferPage',
  component: TokenTransferPage,
  parameters: {
    initialEntries: ['/token-transfer'],
    path: '/token-transfer',
  },
};

export default meta;
type Story = StoryObj<typeof TokenTransferPage>;

export const DefaultStory: Story = {
  render: StoryWrapper,
};

DefaultStory.storyName = 'Default';
