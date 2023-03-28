import React from 'react';
import NewAccountImportForm from '.';

export default {
  title: 'Pages/CreateAccount/ImportAccount',
  component: NewAccountImportForm,
};

export const DefaultStory = (args) => <NewAccountImportForm {...args} />;

DefaultStory.storyName = 'Default';
