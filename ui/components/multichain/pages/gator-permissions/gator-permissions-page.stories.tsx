import React from 'react';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { GatorPermissionsPage } from './gator-permissions-page';

const store = configureStore(mockState);

function StoryWrapper() {
  return (
    <Provider store={store}>
      <GatorPermissionsPage />
    </Provider>
  );
}

const meta: Meta<typeof GatorPermissionsPage> = {
  title: 'Components/Multichain/GatorPermissions/GatorPermissionsPage',
  component: GatorPermissionsPage,
  parameters: {
    initialEntries: ['/gator-permissions'],
    path: '/gator-permissions',
  },
};

export default meta;
type Story = StoryObj<typeof GatorPermissionsPage>;

export const DefaultStory: Story = {
  render: StoryWrapper,
};

DefaultStory.storyName = 'Default';
