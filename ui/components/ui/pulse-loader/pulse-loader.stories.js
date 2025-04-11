import React from 'react';

import PulseLoader from '.';
import README from './README.mdx';

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
