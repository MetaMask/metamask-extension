import React from 'react';
import SettingsSearchList from '.';

export default {
  title: 'Pages/Settings/SettingsSearchList',
  id: __filename,
  argTypes: {
    results: {
      control: 'array',
    },
    onClickSetting: {
      action: 'onClickSetting',
    },
  },
  args: {
    results: [
      {
        image: 'general-icon.svg',
        tab: 'General',
        section: 'General',
        id: 'general',
      },
    ],
  },
};

export const DefaultStory = (args) => <SettingsSearchList {...args} />;

DefaultStory.storyName = 'Default';
