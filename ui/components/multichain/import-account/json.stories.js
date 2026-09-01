import React from 'react';
import JsonImportSubview from './json';

export default {
  title: 'Components/Multichain/JsonImportSubview',
  component: JsonImportSubview,
  argTypes: {
    importErrorMessage: {
      control: {
        type: 'text',
      },
    },
  },
};

export const DefaultStory = () => <JsonImportSubview />;

DefaultStory.storyName = 'Default';
