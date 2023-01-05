import React from 'react';
import README from './README.mdx';
import Confusable from './confusable.component';

export default {
  title: 'Components/UI/Confusable',

  component: Confusable,
  parameters: {
    docs: {
      page: README,
    },
  },
  argsTypes: {
    input: {
      control: 'text',
    },
  },
};

export const DefaultConfusable = (args) => {
  return <Confusable {...args} />;
};

export const NonConfusable = (args) => {
  return <Confusable {...args} />;
};

DefaultConfusable.storyName = 'Default';
DefaultConfusable.args = {
  input: 'vita‍lik.eth',
};

NonConfusable.storyName = 'NonConfusable';
NonConfusable.args = {
  input: '👻.eth',
};
