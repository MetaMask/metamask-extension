import React from 'react';
import { AddressSnippetButton } from '.';

export default {
  title: 'Components/Multichain/AddressSnippetButton',
  component: AddressSnippetButton,
  argTypes: {
    address: {
      control: 'text',
    },
    shorten: {
      control: 'boolean',
    },
  },
  args: {
    address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
  },
};

export const DefaultStory = (args) => <AddressSnippetButton {...args} />;
DefaultStory.storyName = 'Default';

export const ShortenedStory = (args) => (
  <AddressSnippetButton shorten {...args} />
);
DefaultStory.storyName = 'Shortened';
