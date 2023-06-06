import React from 'react';
import IconBorder from './icon-border';

export default {
  title: 'Components/UI/IconBorder',

  component: IconBorder,
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    size: {
      control: 'number',
    },
  },
  args: {
    className: '',
    children: 'D',
    size: 5,
  },
};

export const DefaultStory = (args) => <IconBorder {...args} />;

DefaultStory.storyName = 'Default';
