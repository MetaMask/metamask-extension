import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { TokenManagementPage } from './token-management';

const store = configureStore(mockState);

function StoryWrapper() {
  return (
    <Provider store={store}>
      <TokenManagementPage />
    </Provider>
  );
}

const meta: Meta<typeof TokenManagementPage> = {
  title: 'Pages/TokenManagement/TokenManagementPage',
  component: TokenManagementPage,
  parameters: {
    initialEntries: ['/token-management'],
    path: '/token-management',
  },
};

export default meta;
type Story = StoryObj<typeof TokenManagementPage>;

export const DefaultStory: Story = {
  render: StoryWrapper,
};

DefaultStory.storyName = 'Default';
