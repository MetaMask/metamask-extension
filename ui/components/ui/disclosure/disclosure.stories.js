import React from 'react';
import Disclosure from '.';

export default {
  title: 'Components/UI/Disclosure', // title should follow the folder structure location of the component. Don't use spaces.

  argTypes: {
    children: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
    size: {
      control: 'text',
    },
  },
  args: {
    title: 'title',
    children: 'hello world',
    size: 'normal',
  },
};

export const DefaultStory = (args) => <Disclosure {...args} />;

DefaultStory.storyName = 'Default';
