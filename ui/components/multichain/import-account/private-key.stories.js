import React from 'react';
import PrivateKeyImportView from './private-key';

export default {
  title: 'Components/Multichain/ImportAccount/PrivateKey',
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
