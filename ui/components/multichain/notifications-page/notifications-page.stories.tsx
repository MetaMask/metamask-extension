import React from 'react';
import { Provider } from 'react-redux';
import { Meta } from '@storybook/react';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { NotificationsPage } from './notifications-page';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/NotificationsPage',
  component: NotificationsPage,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
} as Meta;

export const DefaultStory = () => (
  <NotificationsPage>
    Notification Page Header and Content Here
  </NotificationsPage>
);
DefaultStory.storyName = 'Default';
