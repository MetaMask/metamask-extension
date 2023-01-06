import React, { useState } from 'react';
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
        icon: <i className="fa fa-cog" />,
        content: 'General',
        key: 'general',
      },
      {
        icon: <i className="fa fa-address-book" />,
        content: 'Contacts',
        key: 'contacts',
      },
      {
        icon: <i className="fa fa-flask" />,
        content: 'Snaps',
        key: 'snaps',
      },

      {
        icon: <i className="fa fa-lock" />,
        content: 'SecurityAndPrivacy',
        key: 'securityAndPrivacy',
      },
      {
        icon: <i className="fa fa-bell" />,
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
