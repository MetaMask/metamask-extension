import React, { useState } from 'react';
import { Icon, IconName } from '../../component-library';
import TabBar from '.';

export default {
  title: 'Components/App/TabBar',

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
        icon: <Icon name={IconName.Setting} />,
        content: 'General',
        key: 'general',
      },
      {
        icon: <Icon name={IconName.Book} />,
        content: 'Contacts',
        key: 'contacts',
      },
      {
        icon: <Icon name={ICON_NAMES.SNAPS} />,
        content: 'Snaps',
        key: 'snaps',
      },
      {
        icon: <i className="fa fa-lock" />,
        content: 'SecurityAndPrivacy',
        key: 'securityAndPrivacy',
      },
      {
        icon: <Icon name={IconName.Notification} />,
        content: 'Alerts',
        key: 'alerts',
      },
      {
        icon: <i className="fa fa-plug" />,
        content: 'Networks',
        key: 'networks',
      },
      {
        icon: <i className="fa fa-flask" />,
        content: 'Experimental',
        key: 'experimental',
      },
      {
        icon: <i className="fa fa-info-circle" />,
        content: 'About',
        key: 'about',
      },
    ],
  },
};

export const DefaultStory = (args) => {
  const [currentTab, setCurrentTab] = useState('');
  const handleOnSelect = (key) => setCurrentTab(key);
  const handleIsActive = (key) => currentTab === key;
  return (
    <TabBar
      tabs={args.tabs}
      isActive={handleIsActive}
      onSelect={handleOnSelect}
    />
  );
};

DefaultStory.storyName = 'Default';
