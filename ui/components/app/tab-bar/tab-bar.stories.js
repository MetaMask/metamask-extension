import React, { useState } from 'react';
import TabBar from '.';

export default {
  title: 'Components/App/TabBar',
  id: __filename,
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
        icon: <img src="images/general-icon.svg" alt="" />,
        content: 'General',
        key: 'general',
      },
      {
        icon: <img src="images/contacts-icon.svg" alt="" />,
        content: 'Contacts',
        key: 'contacts',
      },
      {
        icon: <img src="images/experimental-icon.svg" />,
        content: 'Snaps',
        key: 'snaps',
      },

      {
        icon: <img src="images/security-icon.svg" alt="" />,
        content: 'SecurityAndPrivacy',
        key: 'securityAndPrivacy',
      },
      {
        icon: <img src="images/alerts-icon.svg" alt="" />,
        content: 'Alerts',
        key: 'alerts',
      },
      {
        icon: <img src="images/network-icon.svg" alt="" />,
        content: 'Networks',
        key: 'networks',
      },
      {
        icon: <img src="images/experimental-icon.svg" alt="" />,
        content: 'Experimental',
        key: 'experimental',
      },
      {
        icon: <img src="images/info-icon.svg" alt="" />,
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
