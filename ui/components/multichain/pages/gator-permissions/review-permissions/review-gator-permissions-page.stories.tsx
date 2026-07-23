import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { ReviewGatorPermissionsPage } from './review-gator-permissions-page';

const store = configureStore(mockState);

function StoryWrapper() {
  return (
    <Provider store={store}>
      <ReviewGatorPermissionsPage />
    </Provider>
  );
}

const meta: Meta<typeof ReviewGatorPermissionsPage> = {
  title: 'Components/Multichain/GatorPermissions/ReviewGatorPermissionsPage',
  component: ReviewGatorPermissionsPage,
  parameters: {
    initialEntries: ['/gator-permissions/0x1/token-transfer'],
    path: '/gator-permissions/:chainId/:permissionGroupName',
  },
};

export default meta;
type Story = StoryObj<typeof ReviewGatorPermissionsPage>;

export const DefaultStory: Story = {
  render: StoryWrapper,
};

DefaultStory.storyName = 'Default';
