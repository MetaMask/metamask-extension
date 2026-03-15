import React from 'react';
import DeveloperOptionsTab from '.';

const DeveloperOptionsTabStory = {
  title: 'Pages/Settings/DeveloperOptionsTab',

  component: DeveloperOptionsTab,
};

export const DefaultStory = ({ variant, address }) => <DeveloperOptionsTab />;

DefaultStory.storyName = 'Default';

export default DeveloperOptionsTabStory;
