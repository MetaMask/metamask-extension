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
    iconClassName: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
  args: {
    iconClassName: 'caret',
  },
};

export const DefaultStory = (args) => <NetworkDisplay {...args} />;

DefaultStory.storyName = 'Default';
