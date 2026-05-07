import React from 'react';
import Debug from './index';

const DebugStory = {
  title: 'Pages/Settings/Debug',

  component: Debug,
};

export const DefaultStory = ({ variant, address }) => <Debug />;

DefaultStory.storyName = 'Default';

export default DebugStory;
