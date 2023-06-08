import React from 'react';
import { ImportAccount } from '.';

export default {
  title: 'Pages/CreateAccount/ImportAccount',
  component: ImportAccount,
};

export const DefaultStory = (args) => <ImportAccount {...args} />;

DefaultStory.storyName = 'Default';
