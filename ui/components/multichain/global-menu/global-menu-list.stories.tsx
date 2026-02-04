import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { GlobalMenuList } from './global-menu-list';
import { GlobalMenuSection } from './global-menu-list.types';
import {
  IconName,
  IconColor,
  TextColor,
} from '@metamask/design-system-react';

const store = configureStore(testData);

const defaultSections: GlobalMenuSection[] = [
  {
    id: 'notifications-section',
    items: [
      {
        id: 'notifications',
        iconName: IconName.Notification,
        label: 'Notifications',
        badge: 5,
        to: '/notifications',
        onClick: () => {
          console.log('Notifications clicked');
        },
      },
      {
        id: 'discover',
        iconName: IconName.Export,
        label: 'Discover',
        onClick: () => {
          console.log('Discover clicked');
        },
      },
      {
        id: 'open-full-screen',
        iconName: IconName.Expand,
        label: 'Open full screen',
        onClick: () => {
          console.log('Open full screen clicked');
        },
      },
    ],
  },
  {
    id: 'manage-section',
    title: 'MANAGE',
    items: [
      {
        id: 'permissions',
        iconName: IconName.SecurityTick,
        label: 'Permissions',
        to: '/permissions',
        onClick: () => {
          console.log('Permissions clicked');
        },
      },
      {
        id: 'networks',
        iconName: IconName.Hierarchy,
        label: 'Networks',
        onClick: () => {
          console.log('Networks clicked');
        },
      },
      {
        id: 'snaps',
        iconName: IconName.Snaps,
        label: 'Snaps',
        to: '/snaps',
        onClick: () => {
          console.log('Snaps clicked');
        },
      },
    ],
  },
  {
    id: 'help-settings-section',
    title: 'HELP AND SETTINGS',
    items: [
      {
        id: 'settings',
        iconName: IconName.Setting,
        label: 'Settings',
        to: '/settings',
        onClick: () => {
          console.log('Settings clicked');
        },
      },
      {
        id: 'support',
        iconName: IconName.MessageQuestion,
        label: 'Support',
        onClick: () => {
          console.log('Support clicked');
        },
      },
    ],
  },
  {
    id: 'logout-section',
    items: [
      {
        id: 'lock',
        iconName: IconName.Lock,
        label: 'Log Out',
        to: '/',
        showChevron: false,
        iconColor: IconColor.ErrorDefault,
        textColor: TextColor.ErrorDefault,
        onClick: () => {
          console.log('Log Out clicked');
        },
      },
    ],
  },
];

export default {
  title: 'Components/Multichain/GlobalMenuList',
  component: GlobalMenuList,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    sections: {
      control: 'object',
      description: 'Array of menu sections to display',
    },
  },
  args: {
    sections: defaultSections,
  },
};

export const DefaultStory = (args: { sections: GlobalMenuSection[] }) => (
  <GlobalMenuList {...args} />
);
DefaultStory.storyName = 'Default';
