import React from 'react';
import PrivateKeyImportView from './private-key';

export default {
  title: 'Pages/CreateAccount/ImportAccount/PrivateKeyImportView',
  component: PrivateKeyImportView,
  argTypes: {
    importAccountFunc: {
      control: {
        type: 'function',
      },
    },
  },
};

export const DefaultStory = (args) => <PrivateKeyImportView {...args} />;

DefaultStory.storyName = 'Default';
