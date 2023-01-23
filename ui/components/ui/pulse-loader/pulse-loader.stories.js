import React from 'react';
import README from './README.mdx';
import PulseLoader from '.';

export default {
  title: 'Components/UI/PulseLoader',

  component: PulseLoader,
  parameters: {
    docs: {
      page: README,
    },
  },
};

export const DefaultStory = () => <PulseLoader />;

DefaultStory.storyName = 'Default';
