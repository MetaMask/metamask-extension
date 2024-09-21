import React from 'react';
import ImportToken from './import-token';

export default {
  title: 'Pages/Swaps/ImportToken',
  argTypes: {
    onImportTokenClick: { action: 'Token Imported' },
    isOpen: { control: 'boolean' },
    tokenForImport: {
      control: 'object',
    },
  },
  args: {
    isOpen: true,
    tokenForImport: {
      iconUrl: './BAT_icon.svg',
      name: 'Basic Attention Token',
      symbol: 'BAT',
      address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
    },
  },
};

export const DefaultStory = (args) => <ImportToken {...args} />;

DefaultStory.storyName = 'Default';
