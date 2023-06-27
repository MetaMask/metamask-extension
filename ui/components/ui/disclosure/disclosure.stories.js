import React from 'react';
import { DISCLOSURE_TYPES } from './disclosure.constants';
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
    type: {
      control: {
        type: 'select',
      },
      options: [...Object.values(DISCLOSURE_TYPES)],
    },
  },
  args: {
    title: 'title',
    children: 'hello world',
    size: 'normal',
    type: DISCLOSURE_TYPES.DEFAULT,
  },
};

export const DefaultStory = (args) => <Disclosure {...args} />;

DefaultStory.storyName = 'Default';
