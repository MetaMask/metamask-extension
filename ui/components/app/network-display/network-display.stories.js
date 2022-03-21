import React from 'react';
import NetworkDisplay from '.';

export default {
  title: 'Components/App/NetworkDisplay',
  id: __filename,
  argTypes: {
    colored: {
      control: 'boolean',
    },
    indicatorSize: {
      control: 'oneOf(Object.values(SIZES))',
    },
    labelProps: {
      control: 'labelProps',
    },
    targetNetwork: {
      control: 'object',
    },
    outline: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
    },
  },
};

export const DefaultStory = (args) => <NetworkDisplay {...args} />;

DefaultStory.storyName = 'Default';
