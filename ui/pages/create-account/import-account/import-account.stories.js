import React from 'react';

import NewAccountImportForm from '.';

export default {
  title: 'Pages/CreateAccount/ImportAccount',
};

export const DefaultStory = (args) => {
  return <NewAccountImportForm {...args} />;
};

DefaultStory.storyName = 'Default';
