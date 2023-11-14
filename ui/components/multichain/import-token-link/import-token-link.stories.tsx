import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ImportTokenLink } from '.';

export default {
  title: 'Components/Multichain/ImportTokenLink',
  component: ImportTokenLink,
} as Meta<typeof ImportTokenLink>;

export const DefaultStory: StoryFn<typeof ImportTokenLink> = () => (
  <ImportTokenLink />
);

DefaultStory.storyName = 'Default';
