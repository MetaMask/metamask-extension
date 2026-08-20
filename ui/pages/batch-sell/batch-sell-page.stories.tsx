import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import BatchSellPage from './batch-sell-page';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      batchSell: { enabled: true },
    },
  },
});

function StoryWrapper() {
  return (
    <Provider store={store}>
      <BatchSellPage />
    </Provider>
  );
}

const meta: Meta<typeof BatchSellPage> = {
  title: 'Pages/BatchSell/BatchSellPage',
  component: BatchSellPage,
  parameters: {
    initialEntries: ['/batch-sell/select'],
    path: '/batch-sell/*',
  },
};

export default meta;
type Story = StoryObj<typeof BatchSellPage>;

export const DefaultStory: Story = {
  render: StoryWrapper,
};

DefaultStory.storyName = 'Default';
