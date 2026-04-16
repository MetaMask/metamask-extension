import React from 'react';
import DebugTabContent from './index';

const DebugTabStory = {
  title: 'Pages/Settings/DebugTab',

  component: DebugTabContent,
};

export const DefaultStory = ({ variant, address }) => <DebugTabContent />;

DefaultStory.storyName = 'Default';

export default DebugTabStory;
