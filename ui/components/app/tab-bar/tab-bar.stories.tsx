import React, { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Icon, IconName } from '@metamask/design-system-react';
import TabBar from '.';

export default {
  title: 'Components/App/TabBar',
  component: TabBar,
  argTypes: {
    isActive: {
      action: 'isActive',
    },
    tabs: {
      control: 'array',
    },
    onSelect: {
      action: 'onSelect',
    },
  },
  args: {
    tabs: [
      {
        iconName: IconName.Setting,
        content: 'General',
        key: 'general',
      },
      {
        iconName: IconName.Book,
        content: 'Contacts',
        key: 'contacts',
      },
      {
        iconName: IconName.Snaps,
        content: 'Snaps',
        key: 'snaps',
      },
      {
        iconName: IconName.Security,
        content: 'SecurityAndPrivacy',
        key: 'securityAndPrivacy',
      },
      {
        iconName: IconName.Notification,
        content: 'Alerts',
        key: 'alerts',
      },
      {
        iconName: IconName.Global,
        content: 'Networks',
        key: 'networks',
      },
      {
        iconName: IconName.Flask,
        content: 'Experimental',
        key: 'experimental',
      },
      {
        iconName: IconName.Info,
        content: 'About',
        key: 'about',
      },
    ],
  },
} as Meta<typeof TabBar>;

export const DefaultStory: StoryFn<typeof TabBar> = (args) => {
  const [currentTab, setCurrentTab] = useState('');
  const handleOnSelect = (key: string) => setCurrentTab(key);
  const handleIsActive = (key: string) => currentTab === key;
  return (
    <TabBar
      tabs={args.tabs}
      isActive={handleIsActive}
      onSelect={handleOnSelect}
    />
  );
};

DefaultStory.storyName = 'Default';
