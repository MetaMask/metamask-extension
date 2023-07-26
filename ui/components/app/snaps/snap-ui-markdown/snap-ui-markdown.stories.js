import React from 'react';
import { SnapUIMarkdown } from './snap-ui-markdown';

export default {
  title: 'Components/App/Snaps/SnapUIMarkdown',
  component: SnapUIMarkdown,
  argTypes: {
    children: {
      control: 'text',
    },
  },
  args: {
    children: 'A Test String',
  },
};

export const DefaultStory = (args) => <SnapUIMarkdown {...args} />;

DefaultStory.storyName = 'Default';
