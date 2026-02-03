import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { GlobalMenuList } from './global-menu-list';
import type { GlobalMenuSection } from './global-menu-list.types';
import { IconName } from '../../component-library';
import { IconColor, TextColor } from '../../../helpers/constants/design-system';

const store = configureStore(testData);

const defaultSections: GlobalMenuSection[] = [
  {
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
      {
        id: 'switch-to-side-panel',
        iconName: IconName.Sidepanel,
        label: 'Switch to side panel',
        onClick: () => {
          console.log('Switch to side panel clicked');
        },
      },
    ],
  },
  {
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
    items: [
      {
        id: 'lock',
        iconName: IconName.Lock,
        label: 'Log Out',
        to: '/',
        showChevron: false,
        iconColor: IconColor.errorDefault,
        textColor: TextColor.errorDefault,
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
