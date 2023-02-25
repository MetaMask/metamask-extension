import React from 'react';
import JsonImportSubview from './json';

export default {
  title: 'Pages/CreateAccount/ImportAccount/JsonImportSubview',
  argTypes: {
    importAccountFunc: {
      control: {
        type: 'function',
      },
    },
  },
};

export const DefaultStory = () => <JsonImportSubview />;

DefaultStory.storyName = 'Default';
